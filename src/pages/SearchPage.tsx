import {
  EventFilterButton,
  EventFilterChips,
} from '@/features/events/components/EventFilterControls'
import { eventFilterChips } from '@/features/events/utils/eventFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { matchesEventFilters } from '@/features/events/utils/eventFilters'
import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  EventFeedCard,
  eventService,
  eventFilterOptionsService,
  type Event,
  type EventFilterFormValues,
} from '@/features/events'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
import { Search } from 'lucide-react'

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  // Parse filters from URL
  const keyword = searchParams.get('keyword') || searchParams.get('search') || ''
  const [mobileQuery, setMobileQuery] = useState(keyword)
  useEffect(() => setMobileQuery(keyword), [keyword])
  const academicYear = searchParams.get('academicYear') || undefined
  const semesterId = searchParams.get('semesterId')
    ? Number(searchParams.get('semesterId'))
    : undefined
  const eventTypeId = searchParams.get('eventTypeId') || undefined
  const rawFanpageId = searchParams.get('fanpageId')
  const rawFanpageIds = searchParams.get('fanpageIds')
  const fanpageIds = useMemo(() => {
    if (rawFanpageIds) return rawFanpageIds.split(',').filter(Boolean)
    if (rawFanpageId) return rawFanpageId.split(',').filter(Boolean)
    return []
  }, [rawFanpageId, rawFanpageIds])
  const fanpageId = fanpageIds.length === 1 ? Number(fanpageIds[0]) : undefined
  const criteriaId = searchParams.get('criteriaId') || undefined
  const pointCategoryId = searchParams.get('pointCategoryId') || undefined
  const status = searchParams.get('status') || undefined
  const dateHappenFrom = searchParams.get('dateHappenFrom') || undefined
  const dateHappenTo = searchParams.get('dateHappenTo') || undefined

  // Active filter payload for BE query:
  // Note: Backend /events specification performs exact matching on pointCategoryId and criteriaId,
  // without recursively expanding category parent/child hierarchy.
  // To support selecting parent categories (e.g. Mục IV) or multi-selection without returning 0 events,
  // we let BE fetch the events (by keyword, semester, type, fanpage, dates) and resolve hierarchical criteria/categories on client.
  const filters = useMemo(
    () => ({
      keyword: keyword || undefined,
      semesterId,
      eventTypeId: eventTypeId?.includes(',')
        ? undefined
        : eventTypeId
          ? Number(eventTypeId)
          : undefined,
      fanpageId,
      criteriaId: undefined,
      pointCategoryId: undefined,
    }),
    [keyword, semesterId, eventTypeId, fanpageId]
  )

  // Fetch events matching search/filter
  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ['events', 'search', filters],
    queryFn: () => eventService.getEvents(filters),
  })

  // Fetch followed fanpages to maintain follow state on cards
  const { data: followedFanpages = [] } = useQuery<any[]>({
    queryKey: ['fanpages', 'sidebar', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        const res: any = await apiClient.get('/fanpages/following', { params: { size: 50 } })
        return res?.content || res?.data || (Array.isArray(res) ? res : [])
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  // Fetch registered events for the user to accurately determine registration and attendance state
  const { data: userRegistrations = [] } = useQuery<any[]>({
    queryKey: ['registrations', 'me', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        const [historyRes, upcomingRes] = await Promise.allSettled([
          apiClient.get('/registrations/me/history', { params: { size: 100 } }),
          apiClient.get('/registrations/me/upcoming'),
        ])
        const historyVal = historyRes.status === 'fulfilled' ? (historyRes.value as any) : null
        const upcomingVal = upcomingRes.status === 'fulfilled' ? (upcomingRes.value as any) : null

        const historyList =
          historyVal?.content || historyVal?.data?.content || historyVal?.data || []
        const upcomingList =
          upcomingVal?.content || upcomingVal?.data?.content || upcomingVal?.data || []

        return [
          ...(Array.isArray(historyList) ? historyList : []),
          ...(Array.isArray(upcomingList) ? upcomingList : []),
        ]
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  // Map eventId -> registration status (REGISTERED, CHECKED_IN, COMPLETED...)
  const registeredEventMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of userRegistrations) {
      const eid = String(r.eventId || r.id)
      const st = String(r.status || 'REGISTERED').toUpperCase()
      if (st !== 'CANCELLED') {
        map.set(eid, st)
      }
    }
    return map
  }, [userRegistrations])

  const followedFanpageIds = useMemo(() => {
    return new Set(followedFanpages.map((fp: any) => String(fp.id)))
  }, [followedFanpages])

  const eventsWithFollowState = useMemo(() => {
    return rawEvents.map((evt) => {
      const regStatus = registeredEventMap.get(String(evt.id))
      return {
        ...evt,
        isFollowed: evt.isFollowed || followedFanpageIds.has(String(evt.organizerId)),
        isRegistered: Boolean(regStatus) || Boolean(evt.isRegistered),
        registrationStatus: regStatus || (evt.isRegistered ? 'REGISTERED' : undefined),
      }
    })
  }, [rawEvents, followedFanpageIds, registeredEventMap])

  // Filter options for labels and childIds
  const { data: filterOptions } = useQuery({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })

  const finalFilteredEvents = useMemo(
    () =>
      eventsWithFollowState.filter((event) =>
        matchesEventFilters(
          event,
          {
            status,
            academicYear,
            semesterId: semesterId === undefined ? undefined : String(semesterId),
            eventTypeId,
            pointCategoryId,
            criteriaId,
            fanpageIds,
            dateHappenFrom,
            dateHappenTo,
          },
          filterOptions
        )
      ),
    [
      eventsWithFollowState,
      status,
      academicYear,
      semesterId,
      eventTypeId,
      pointCategoryId,
      criteriaId,
      fanpageIds,
      dateHappenFrom,
      dateHappenTo,
      filterOptions,
    ]
  )

  // Handlers for EventFeedCard actions
  const handleRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'search', filters], (old: Event[] = []) =>
      old.map((e) =>
        e.id === eventId
          ? { ...e, isRegistered: true, registeredCount: (e.registeredCount || 0) + 1 }
          : e
      )
    )
    setNotificationMessage('Đăng ký sự kiện thành công!')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleCancelRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'search', filters], (old: Event[] = []) =>
      old.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isRegistered: false,
              registeredCount: Math.max(0, (e.registeredCount || 1) - 1),
            }
          : e
      )
    )
    setNotificationMessage('Đã hủy đăng ký sự kiện')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleSave = async (eventId: string) => {
    const currentEvent = rawEvents.find((e: Event) => String(e.id) === String(eventId))
    const nextSavedState = !currentEvent?.isSaved

    queryClient.setQueryData(['events', 'search', filters], (old: Event[] = []) =>
      old.map((e) => (String(e.id) === String(eventId) ? { ...e, isSaved: nextSavedState } : e))
    )

    try {
      if (nextSavedState) {
        await eventService.storeEvent(eventId)
      } else {
        await eventService.unstoreEvent(eventId)
      }
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'search', filters] })
    }
  }

  const handleToggleFollow = (organizerId: string) => {
    queryClient.setQueryData(['events', 'search', filters], (old: Event[] = []) =>
      old.map((e) =>
        String(e.organizerId) === String(organizerId) ? { ...e, isFollowed: !e.isFollowed } : e
      )
    )
  }

  // Remove individual filter chip
  // Apply from modal
  const handleApplyFilterModal = (values: EventFilterFormValues) => {
    const next = new URLSearchParams()
    if (keyword) next.set('keyword', keyword)
    Object.entries(values).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) {
        next.set(k, v.join(','))
      } else if (v && String(v).trim()) {
        next.set(k, String(v).trim())
      }
    })
    setSearchParams(next)
  }

  const currentModalValues: EventFilterFormValues = {
    academicYear,
    semesterId: semesterId ? String(semesterId) : undefined,
    eventTypeId,
    fanpageId: fanpageIds.length === 1 ? fanpageIds[0] : undefined,
    fanpageIds: fanpageIds.length > 0 ? fanpageIds : undefined,
    criteriaId: criteriaId ? String(criteriaId) : undefined,
    pointCategoryId,
    status,
    dateHappenFrom,
    dateHappenTo,
  }

  const hasFilters = eventFilterChips(currentModalValues, filterOptions).length > 0

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-muted/40 dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* 3-Column Layout matching HomePage */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Organization Navigation Sidebar */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Search Results Feed */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-3 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-[680px] flex flex-col gap-3 pb-8 sm:pb-12">
            <div className="flex flex-col gap-3 px-1 py-1 text-left">
              <form
                className="flex items-center gap-2 md:hidden"
                onSubmit={(event) => {
                  event.preventDefault()
                  const next = new URLSearchParams(searchParams)
                  next.delete('search')
                  if (mobileQuery.trim()) next.set('keyword', mobileQuery.trim())
                  else next.delete('keyword')
                  setSearchParams(next)
                }}
              >
                <Input
                  aria-label="Tìm kiếm trong kết quả"
                  placeholder="Tìm kiếm sự kiện..."
                  value={mobileQuery}
                  onChange={(event) => setMobileQuery(event.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-lg text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label="Tìm kiếm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h1 className="truncate font-k2d text-lg font-semibold text-foreground">
                    {keyword ? (
                      <>
                        Kết quả cho: <span className="text-primary">"{keyword}"</span>
                      </>
                    ) : (
                      'Tìm sự kiện'
                    )}
                  </h1>
                  <span className="text-xs text-muted-foreground">
                    {isLoading ? 'Đang tìm kiếm…' : `${finalFilteredEvents.length} sự kiện`}
                  </span>
                </div>
                <EventFilterButton
                  values={currentModalValues}
                  onChange={handleApplyFilterModal}
                  options={filterOptions}
                  events={rawEvents}
                />
              </div>
              <EventFilterChips
                values={currentModalValues}
                onChange={handleApplyFilterModal}
                options={filterOptions}
              />
            </div>

            {/* Results List */}
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((number) => (
                    <div
                      key={number}
                      className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 animate-pulse"
                    >
                      <div className="h-28 w-20 shrink-0 rounded-lg bg-muted" />
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="h-3 w-1/3 rounded bg-muted" />
                        <div className="h-5 w-full rounded bg-muted" />
                        <div className="h-3 w-2/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : finalFilteredEvents.length > 0 ? (
                finalFilteredEvents.map((event) => (
                  <EventFeedCard
                    key={event.id}
                    event={event}
                    variant="list"
                    onRegister={handleRegister}
                    onCancelRegister={handleCancelRegister}
                    onToggleSave={handleToggleSave}
                    onToggleFollow={handleToggleFollow}
                  />
                ))
              ) : (
                /* Empty state */
                <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                  <div className="h-10 w-10 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-k2d font-semibold text-base text-foreground mt-1">
                    Không tìm thấy sự kiện phù hợp
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    {keyword ? (
                      <>
                        Không có sự kiện nào khớp với từ khóa <strong>"{keyword}"</strong> cùng các
                        tiêu chí lọc đang chọn.
                      </>
                    ) : (
                      'Không có sự kiện nào phù hợp với các tiêu chí lọc đã chọn.'
                    )}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    {hasFilters && (
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => handleApplyFilterModal({})}
                        variant="outline"
                        className="h-9 rounded-lg text-xs"
                      >
                        Xóa tất cả bộ lọc
                      </Button>
                    )}
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => navigate('/')}
                      className="h-9 rounded-lg text-xs"
                    >
                      Về trang chủ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
export default SearchPage
