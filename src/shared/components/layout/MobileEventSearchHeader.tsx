import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MobileEventSearchHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword') || params.get('search') || ''
  const [draft, setDraft] = useState(keyword)
  const [composing, setComposing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const focusOnEntry = useRef(navigationType !== 'POP' && Boolean(location.state?.focusSearch))
  useEffect(() => {
    if (focusOnEntry.current) input.current?.focus()
    focusOnEntry.current = false
  }, [])
  useEffect(() => setDraft(keyword), [keyword])
  const serializedParams = params.toString()
  const commit = useCallback(
    (value: string) => {
      clearTimeout(timer.current)
      const next = new URLSearchParams(serializedParams)
      next.delete('search')
      next.delete('page')
      if (value.trim()) next.set('keyword', value.trim())
      else next.delete('keyword')
      if (next.toString() !== serializedParams)
        setParams(next, { replace: true, state: location.state })
    },
    [serializedParams, setParams, location.state]
  )
  useEffect(() => {
    if (composing || draft.trim() === keyword) return
    timer.current = setTimeout(() => commit(draft), 350)
    return () => clearTimeout(timer.current)
  }, [draft, keyword, composing, commit])
  return (
    <header
      aria-label="Tìm kiếm sự kiện"
      className="sticky top-0 z-50 shrink-0 border-b border-border bg-background pt-[env(safe-area-inset-top)] md:hidden"
    >
      <div className="flex h-14 min-w-0 items-center gap-1 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Quay lại trang trước"
          onClick={() => {
            clearTimeout(timer.current)
            if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0)
              navigate(-1)
            else navigate('/', { replace: true })
          }}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <form
          role="search"
          aria-label="Tìm kiếm sự kiện"
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault()
            if (!composing) {
              commit(draft)
              input.current?.blur()
            }
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Input
              ref={input}
              type="search"
              enterKeyHint="search"
              aria-label="Tìm kiếm sự kiện"
              placeholder="Tìm kiếm sự kiện…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={(event) => {
                setComposing(false)
                setDraft(event.currentTarget.value)
              }}
              className="h-11 min-w-0 bg-muted/50 pr-11 text-base [&::-webkit-search-cancel-button]:appearance-none"
            />
            {draft && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 w-11"
                aria-label="Xóa từ khóa"
                onClick={() => {
                  setDraft('')
                  commit('')
                  input.current?.focus()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Thực hiện tìm kiếm"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </header>
  )
}
