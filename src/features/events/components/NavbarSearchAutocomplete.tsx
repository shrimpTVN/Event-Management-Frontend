import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useState, useEffect, useRef, useId } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Calendar, ArrowRight, Loader2, X } from 'lucide-react'
import { eventService } from '../services/eventService'
import type { Event } from '../types/event.types'

export const NavbarSearchAutocomplete: React.FC = () => {
  const navigate = useNavigate()
  const listId = useId()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync initial query from URL if on search page
  useEffect(() => {
    const q = searchParams.get('keyword') || searchParams.get('search') || ''
    setQuery(q)
    setIsOpen(false)
    setActiveIndex(-1)
  }, [searchParams])

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch suggestions when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    if (debouncedQuery !== query.trim()) return

    let isCancelled = false
    setIsLoading(true)

    eventService
      .getEvents({ keyword: debouncedQuery, size: 5 })
      .then((results) => {
        if (!isCancelled) {
          setSuggestions(results.slice(0, 5))
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSuggestions([])
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, query])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsOpen(false)

    const params = new URLSearchParams(searchParams)
    if (query.trim()) {
      params.set('keyword', query.trim())
      params.delete('search')
    } else {
      params.delete('keyword')
      params.delete('search')
    }

    navigate(`/search?${params.toString()}`)
  }

  const handleSelectSuggestion = (event: Event) => {
    setIsOpen(false)
    navigate(`/events/${event.id}`)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="hidden md:flex min-w-0 flex-1 max-w-xl mx-8 relative items-center"
      >
        <form onSubmit={handleSubmit} className="relative w-full flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
          <Input
            role="combobox"
            aria-label="Tìm kiếm sự kiện"
            aria-autocomplete="list"
            aria-expanded={isOpen && Boolean(query.trim())}
            aria-controls={isOpen && !isLoading && suggestions.length > 0 ? listId : undefined}
            aria-activedescendant={
              isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSuggestions([])
              setIsLoading(Boolean(e.target.value.trim()))
              setActiveIndex(-1)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' || event.key === 'Tab') {
                setIsOpen(false)
                setActiveIndex(-1)
              }
              if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
                event.preventDefault()
                setIsOpen(true)
                setActiveIndex((index) =>
                  event.key === 'ArrowDown'
                    ? (index + 1) % suggestions.length
                    : index <= 0
                      ? suggestions.length - 1
                      : index - 1
                )
              }
              if (event.key === 'Enter' && isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
                event.preventDefault()
                handleSelectSuggestion(suggestions[activeIndex])
              }
            }}
            placeholder="Tìm kiếm sự kiện..."
            className="h-10 w-full min-w-0 rounded-lg border-border bg-muted/30 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
          />

          {query && (
            <Tooltip content="Xóa tìm kiếm">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => {
                  setQuery('')
                  setSuggestions([])
                }}
                className="absolute right-2 h-8 w-8 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          )}

        </form>

        {isOpen && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 min-w-0 overflow-hidden rounded-xl border border-border bg-background text-left shadow-lg">
            {isLoading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Đang tìm kiếm…
              </div>
            ) : suggestions.length > 0 ? (
              <>
                <p className="px-3 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">
                  Gợi ý sự kiện
                </p>
                <div
                  id={listId}
                  role="listbox"
                  aria-label="Gợi ý sự kiện"
                  className="max-h-[320px] overflow-x-hidden overflow-y-auto p-1.5"
                >
                  {suggestions.slice(0, 5).map((event, index) => {
                    const date = event.startTime ? new Date(event.startTime) : null
                    const time =
                      date && Number.isFinite(date.getTime())
                        ? date.toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : ''
                    return (
                      <Button
                        key={event.id}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={activeIndex === index}
                        aria-label={event.title}
                        tabIndex={-1}
                        variant="ghost"
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelectSuggestion(event)}
                        className={`flex h-auto w-full min-w-0 max-w-full justify-start gap-3 rounded-lg px-2 py-2 text-left whitespace-normal ${activeIndex === index ? 'bg-primary/5' : 'hover:bg-muted/60'}`}
                      >
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-md border border-border/60 object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                            <Calendar className="h-5 w-5" />
                          </span>
                        )}
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
                            {event.title}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
                            {time && (
                              <>
                                <span className="shrink-0">{time}</span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span className="min-w-0 truncate">
                              {event.organizerFullName ||
                                event.organizerName ||
                                event.fanpageName ||
                                'CTU'}
                            </span>
                          </span>
                        </span>
                      </Button>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSubmit()}
                  className="flex h-10 w-full justify-between rounded-none border-t border-border px-3 text-xs font-medium text-primary hover:bg-primary/5"
                >
                  Xem tất cả kết quả
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 p-4 text-xs text-muted-foreground">
                <p>Chưa có kết quả phù hợp</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSubmit()}
                  className="h-8 gap-1.5 text-xs text-primary"
                >
                  Tìm kiếm tất cả
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </>
  )
}
