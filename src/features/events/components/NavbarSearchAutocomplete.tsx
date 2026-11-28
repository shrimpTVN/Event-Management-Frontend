import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Building2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { eventService } from '../services/eventService'
import { fanpageSearchService } from '@/features/fanpage/services/fanpageSearchService'

interface Suggestion {
  id: string
  name: string
  image?: string
  detail?: string
  kind: 'event' | 'fanpage'
}

export function NavbarSearchAutocomplete({
  mobile = false,
  autoFocus = false,
}: {
  mobile?: boolean
  autoFocus?: boolean
}) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const keyword = params.get('keyword') || params.get('search') || ''
  const [query, setQuery] = useState(keyword)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [composing, setComposing] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    setQuery(keyword)
    setOpen(false)
    setActive(-1)
  }, [keyword])
  useEffect(() => {
    if (autoFocus) input.current?.focus()
  }, [autoFocus])
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])
  useEffect(() => {
    if (!open || !query.trim() || composing) return
    let cancelled = false
    const controller = new AbortController()
    const isAbortError = (err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return true
      if (typeof err === 'object' && err !== null) {
        const record = err as { name?: string; code?: string }
        return (
          record.name === 'AbortError' ||
          record.name === 'CanceledError' ||
          record.code === 'ERR_CANCELED'
        )
      }
      return false
    }
    const timer = setTimeout(async () => {
      const trimmed = query.trim()
      const [events, pages] = await Promise.allSettled([
        eventService.getEvents({
          keyword: trimmed,
          size: 3,
          statuses: ['PUBLISHED'],
          signal: controller.signal,
        }),
        fanpageSearchService.search(trimmed, 3, controller.signal),
      ])
      if (cancelled || controller.signal.aborted) return
      const eventFailed = events.status === 'rejected' && !isAbortError(events.reason)
      const pageFailed = pages.status === 'rejected' && !isAbortError(pages.reason)
      setFailed(eventFailed || pageFailed)
      setSuggestions([
        ...(events.status === 'fulfilled'
          ? events.value.slice(0, 3).map((event): Suggestion => ({
              id: String(event.id),
              name: event.title,
              image: event.bannerUrl,
              kind: 'event',
              detail: [
                event.startTime ? new Date(event.startTime).toLocaleDateString('vi-VN') : '',
                event.organizerFullName || event.organizerName || event.fanpageName,
              ]
                .filter(Boolean)
                .join(' · '),
            }))
          : []),
        ...(pages.status === 'fulfilled'
          ? pages.value.slice(0, 3).map((page): Suggestion => ({
              id: page.id,
              name: page.name,
              image: page.avatarUrl,
              detail: 'Fanpage',
              kind: 'fanpage',
            }))
          : []),
      ])
      setLoading(false)
    }, 250)
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, open, composing])

  const submit = () => {
    setOpen(false)
    input.current?.blur()
    const next = new URLSearchParams(params)
    next.delete('search')
    next.delete('page')
    next.set('tab', 'all')
    if (query.trim()) next.set('keyword', query.trim())
    else next.delete('keyword')
    navigate(`/search?${next}`)
  }
  const select = (item: Suggestion) => {
    setOpen(false)
    navigate(`/${item.kind === 'event' ? 'events' : 'fanpage'}/${item.id}`)
  }
  const expanded = open && Boolean(query.trim())
  return (
    <div
      ref={container}
      className={
        mobile
          ? 'relative min-w-0 flex-1'
          : 'relative mx-8 hidden min-w-0 max-w-xl flex-1 items-center md:flex'
      }
    >
      <form
        role="search"
        aria-label="Tìm kiếm sự kiện và fanpage"
        className="relative flex w-full items-center"
        onSubmit={(event) => {
          event.preventDefault()
          if (!composing) submit()
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={input}
          role={mobile ? 'searchbox' : 'combobox'}
          type={mobile ? 'search' : 'text'}
          enterKeyHint="search"
          aria-label="Tìm kiếm sự kiện và fanpage"
          placeholder="Tìm kiếm sự kiện, fanpage…"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded && !loading ? listId : undefined}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSuggestions([])
            setLoading(Boolean(event.target.value.trim()))
            setFailed(false)
            setActive(-1)
            setOpen(true)
          }}
          onFocus={() => {
            setActive(-1)
            if (query.trim()) {
              setOpen(true)
              setLoading(true)
            }
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Tab') {
              setOpen(false)
              setActive(-1)
            }
            if (composing || event.nativeEvent.isComposing) return
            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
              event.preventDefault()
              setOpen(true)
              setActive((index) =>
                event.key === 'ArrowDown'
                  ? (index + 1) % suggestions.length
                  : index <= 0
                    ? suggestions.length - 1
                    : index - 1
              )
            }
            if (event.key === 'Enter' && expanded && active >= 0 && suggestions[active]) {
              event.preventDefault()
              select(suggestions[active])
            }
          }}
          className={`w-full min-w-0 rounded-lg border-border bg-muted/30 pl-10 pr-20 text-foreground placeholder:text-gray-400 [&::-webkit-search-cancel-button]:appearance-none ${mobile ? 'h-11 text-base' : 'h-10 text-sm'}`}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xóa từ khóa"
            className="absolute right-10 h-9 w-9"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setOpen(false)
              setActive(-1)
              input.current?.focus()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Thực hiện tìm kiếm"
          className="absolute right-0 h-10 w-10"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {expanded && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-background text-left shadow-lg">
          {loading ? (
            <p role="status" className="p-4 text-sm text-muted-foreground">
              Đang tìm kiếm…
            </p>
          ) : (
            <>
              <div
                id={listId}
                role="listbox"
                aria-label="Gợi ý tìm kiếm"
                className="max-h-[min(60dvh,420px)] overflow-y-auto p-2"
              >
                {(['event', 'fanpage'] as const).map((kind) => (
                  <div
                    key={kind}
                    role="group"
                    aria-label={kind === 'event' ? 'Sự kiện' : 'Fanpage'}
                  >
                    {suggestions.some((item) => item.kind === kind) && (
                      <p className="px-2 py-2 text-xs font-medium text-muted-foreground">
                        {kind === 'event' ? 'Sự kiện' : 'Fanpage'}
                      </p>
                    )}
                    {suggestions.map((item, index) =>
                      item.kind !== kind ? null : (
                        <Button
                          key={`${kind}-${item.id}`}
                          type="button"
                          variant="ghost"
                          role="option"
                          id={`${listId}-${index}`}
                          aria-selected={active === index}
                          aria-label={item.name}
                          tabIndex={-1}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => select(item)}
                          className={`h-auto w-full min-w-0 justify-start gap-3 whitespace-normal px-2 py-2 text-left ${active === index ? 'bg-primary/5' : ''}`}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className={`h-10 w-10 shrink-0 object-cover ${kind === 'fanpage' ? 'rounded-full' : 'rounded-lg'}`}
                            />
                          ) : (
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary ${kind === 'fanpage' ? 'rounded-full' : 'rounded-lg'}`}
                            >
                              {kind === 'event' ? (
                                <Calendar className="h-5 w-5" />
                              ) : (
                                <Building2 className="h-5 w-5" />
                              )}
                            </span>
                          )}
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="line-clamp-2 text-sm font-medium">{item.name}</span>
                            <span className="truncate text-xs font-normal text-muted-foreground">
                              {item.detail}
                            </span>
                          </span>
                        </Button>
                      )
                    )}
                  </div>
                ))}
                {!suggestions.length && (
                  <p className="p-3 text-sm text-muted-foreground">
                    {failed
                      ? 'Chưa tải được gợi ý. Bạn vẫn có thể tìm kiếm.'
                      : 'Chưa có kết quả phù hợp'}
                  </p>
                )}
                {failed && suggestions.length > 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    Chưa tải được đầy đủ gợi ý.
                  </p>
                )}
              </div>
            </>
          )}
          <Button
            variant="ghost"
            className="h-auto min-h-11 w-full justify-start whitespace-normal rounded-none border-t border-border px-4 py-3 text-sm text-primary"
            onClick={submit}
          >
            Xem tất cả kết quả cho “{query.trim()}”
          </Button>
        </div>
      )}
    </div>
  )
}
