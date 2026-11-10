import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, Calendar, Building, ArrowRight, Loader2, X } from 'lucide-react'
import { eventService } from '../services/eventService'
import type { Event } from '../types/event.types'
import { EventFilterModal, type EventFilterFormValues } from './EventFilterModal'

export const NavbarSearchAutocomplete: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync initial query from URL if on search page
  useEffect(() => {
    const q = searchParams.get('keyword') || searchParams.get('search') || ''
    if (q) {
      setQuery(q)
    }
  }, [searchParams])

  // Count active filters in URL params
  const activeFiltersCount = [
    'academicYear',
    'semesterId',
    'eventTypeId',
    'fanpageId',
    'criteriaId',
    'pointCategoryId',
    'status',
    'dateHappenFrom',
    'dateHappenTo',
  ].filter((key) => Boolean(searchParams.get(key))).length

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

    let isCancelled = false
    setIsLoading(true)

    eventService
      .getEvents({ keyword: debouncedQuery, size: 5 })
      .then((results) => {
        if (!isCancelled) {
          setSuggestions(results)
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
  }, [debouncedQuery])

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

  const handleApplyFilter = (values: EventFilterFormValues) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('keyword', query.trim())
    }

    Object.entries(values).forEach(([key, val]) => {
      if (Array.isArray(val) && val.length > 0) {
        params.set(key, val.join(','))
      } else if (val && String(val).trim()) {
        params.set(key, String(val).trim())
      }
    })

    navigate(`/search?${params.toString()}`)
  }

  // Current filter values from URL to populate modal
  const rawFanpageIds = searchParams.get('fanpageIds')
  const fanpageId = searchParams.get('fanpageId')
  const parsedFanpageIds = rawFanpageIds
    ? rawFanpageIds.split(',').filter(Boolean)
    : fanpageId
    ? [fanpageId]
    : undefined

  const currentFilterValues: EventFilterFormValues = {
    academicYear: searchParams.get('academicYear') || undefined,
    semesterId: searchParams.get('semesterId') || undefined,
    eventTypeId: searchParams.get('eventTypeId') || undefined,
    fanpageId: fanpageId || undefined,
    fanpageIds: parsedFanpageIds,
    criteriaId: searchParams.get('criteriaId') || undefined,
    pointCategoryId: searchParams.get('pointCategoryId') || undefined,
    status: searchParams.get('status') || undefined,
    dateHappenFrom: searchParams.get('dateHappenFrom') || undefined,
    dateHappenTo: searchParams.get('dateHappenTo') || undefined,
  }

  return (
    <>
      <div ref={containerRef} className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center">
        <form onSubmit={handleSubmit} className="relative w-full flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true)
            }}
            placeholder="Tìm kiếm sự kiện..."
            className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-20 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
              }}
              className="absolute right-10 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              activeFiltersCount > 0
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={activeFiltersCount > 0 ? `Đang bật ${activeFiltersCount} bộ lọc` : 'Bộ lọc nâng cao'}
            aria-label="Mở bộ lọc nâng cao"
          >
            <Filter className="h-3.5 w-3.5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </form>

        {/* Suggestions Popover */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border bg-white dark:bg-card shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Đang tìm kiếm gợi ý...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-1">
                <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                  Gợi ý sự kiện phù hợp
                </div>
                <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                  {suggestions.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(evt)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#F3F4F6] dark:hover:bg-muted/80 transition-colors cursor-pointer flex items-center gap-3 group"
                    >
                      {evt.bannerUrl ? (
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="h-10 w-14 object-cover rounded-md shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <Building className="h-3 w-3 shrink-0" />
                            {evt.organizerName || evt.fanpageName || 'CTU'}
                          </span>
                          {evt.pointsReward && (
                            <span className="text-primary font-medium shrink-0">
                              • {evt.pointsReward}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* View all search results option */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full text-left px-3.5 py-2.5 bg-muted/40 hover:bg-muted text-primary text-xs font-medium border-t border-border flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>
                    Xem tất cả kết quả cho <strong>"{query.trim()}"</strong>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-4 px-3.5 text-center text-xs text-muted-foreground space-y-1">
                <p>Không tìm thấy sự kiện nào khớp với "{query.trim()}"</p>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="text-primary font-medium hover:underline cursor-pointer inline-flex items-center gap-1 mt-1"
                >
                  <span>Tìm kiếm nâng cao với bộ lọc</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal dropping from top */}
      <EventFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialValues={currentFilterValues}
        onApply={handleApplyFilter}
      />
    </>
  )
}

