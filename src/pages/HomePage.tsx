import {
  EventFilterButton,
  EventFilterChips,
} from '@/features/events/components/EventFilterControls'
import { createEventFilterMatcher } from '@/features/events/utils/eventFilters'
import type { EventFilterFormValues } from '@/features/events/components/EventFilterModal'
import { eventFilterOptionsService } from '@/features/events/services/eventFilterOptionsService'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutList, PanelsTopLeft, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useAuthStore } from '@/features/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fanpageService } from '@/features/fanpage'
import { isEventMatchingRegistrationStatus } from '@/features/events/services/eventService'
import {
  followedFanpagesQueryKey,
  fetchFollowedFanpages,
} from '@/shared/services/followedFanpages'
import { userRegistrationsQueryOptions } from '@/shared/services/userRegistrations'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  FeedTabs,
  EventFeedCard,
  eventService,
  queueRecommendedEventViews,
  getPendingEventViewBatch,
  hasInFlightEventViewFlush,
  flushPendingEventViews,
  flushPendingEventViewsKeepalive,
  type FeedTabType,
  type Event,
} from '@/features/events'
import { Skeleton } from '@/components/ui/skeleton'

export const HomePage: React.FC = () => {
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FeedTabType>('DISCOVER')
  const [filterValues, setFilterValues] = useState<EventFilterFormValues>({})
  const { data: filterOptions } = useQuery({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60_000,
    enabled: Object.values(filterValues).some(Boolean),
  })
  const [viewMode, setViewMode] = useState<'post' | 'list'>(() => {
    try {
      return localStorage.getItem('student-home-view') === 'list' ? 'list' : 'post'
    } catch {
      return 'post'
    }
  })
  const effectiveViewMode = isMobile ? 'post' : viewMode

  const changeView = (mode: 'post' | 'list') => {
    setViewMode(mode)
    try {
      localStorage.setItem('student-home-view', mode)
    } catch {
      /* The view remains usable without storage. */
    }
  }
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  const { isAuthenticated, user, token } = useAuthStore()
  const viewUserKey = isAuthenticated ? String(user?.id ?? user?.email ?? 'auth') : null
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const feedListRef = useRef<HTMLDivElement | null>(null)

  const {
    data: events = [],
    isLoading,
    isError: isFeedError,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ['events', 'feed', 'PUBLISHED'],
    queryFn: () => eventService.getEvents({ statuses: ['PUBLISHED'] }),
  })

  // Fetch personalized event recommendations for authenticated student
  const { data: recommendedEvents = [], isLoading: isLoadingRecommendations } = useQuery<Event[]>({
    queryKey: ['events', 'recommendations', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        if (viewUserKey) {
          await flushPendingEventViews(viewUserKey, (batch) =>
            eventService.recordEventViews(batch)
          ).catch(() => ({ ok: false, sentCount: 0 }))
        }
        return await eventService.getRecommendations({ size: 50 })
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60_000,
  })

  const recommendationMap = useMemo(() => {
    const map = new Map<string, { event: Event; rankIndex: number }>()
    recommendedEvents.forEach((item, index) => {
      map.set(String(item.id), { event: item, rankIndex: index })
    })
    return map
  }, [recommendedEvents])

  // Fetch followed fanpages using shared normalized query key & shape across Home/Detail/Sidebar
  const { data: followedFanpages = [] } = useQuery({
    queryKey: followedFanpagesQueryKey(isAuthenticated),
    queryFn: () => (isAuthenticated ? fetchFollowedFanpages() : Promise.resolve([])),
    enabled: isAuthenticated,
  })

  const followedFanpageIds = useMemo(() => {
    return new Set(followedFanpages.map((fp: any) => String(fp.id)))
  }, [followedFanpages])

  // Fetch stored events for the user to accurately mark isSaved state
  const { data: storedEvents = [] } = useQuery<Event[]>({
    queryKey: ['events', 'stored', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        return await eventService.getStoredEvents()
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  const storedEventIds = useMemo(() => {
    return new Set(storedEvents.map((e) => String(e.id)))
  }, [storedEvents])

  // Fetch registered events using shared user-scoped query (loads all pages, rejects on source failure)
  const { data: registeredStatusMap = {} } = useQuery(
    userRegistrationsQueryOptions(isAuthenticated, user?.id)
  )

  const registeredEventMap = useMemo(() => {
    return new Map<string, string>(Object.entries(registeredStatusMap))
  }, [registeredStatusMap])

  const eventsWithFollowState = useMemo(() => {
    return events.map((evt) => {
      const regStatus = registeredEventMap.get(String(evt.id))
      const recEntry = recommendationMap.get(String(evt.id))
      return {
        ...evt,
        isFollowed: evt.isFollowed || followedFanpageIds.has(String(evt.organizerId)),
        isSaved: storedEventIds.has(String(evt.id)) || Boolean(evt.isSaved),
        isRegistered: isAuthenticated ? Boolean(regStatus) : false,
        registrationStatus: isAuthenticated ? regStatus : undefined,
        recommendationExplain: isAuthenticated
          ? recEntry?.event.recommendationExplain ?? evt.recommendationExplain
          : undefined,
        recommendationScore: isAuthenticated
          ? recEntry?.event.recommendationScore ?? evt.recommendationScore
          : undefined,
        fulfillsCriteria: isAuthenticated
          ? recEntry?.event.fulfillsCriteria ?? evt.fulfillsCriteria
          : undefined,
        isViewed: isAuthenticated ? Boolean(recEntry?.event.isViewed ?? evt.isViewed) : false,
        isRecommended: isAuthenticated ? Boolean(recEntry || evt.isRecommended) : false,
      }
    })
  }, [
    events,
    followedFanpageIds,
    storedEventIds,
    registeredEventMap,
    recommendationMap,
    isAuthenticated,
  ])

  const handleTabChange = (tab: FeedTabType) => {
    setActiveTab(tab)
    if (filterValues.feedScope) {
      setFilterValues((prev) => {
        const next = { ...prev }
        delete next.feedScope
        return next
      })
    }
  }

  // HomePage only displays events currently open for registration
  const openRegistrationEvents = useMemo(
    () =>
      eventsWithFollowState.filter((evt) =>
        isEventMatchingRegistrationStatus(evt, 'OPEN_REGISTRATION')
      ),
    [eventsWithFollowState]
  )

  const activeFeedScope = filterValues.feedScope || (activeTab !== 'DISCOVER' ? activeTab : undefined)

  // Filter & rank events by selected feed tab (or feedScope in filter values)
  const tabEvents = useMemo(() => {
    if (activeFeedScope === 'FOLLOWING') {
      return openRegistrationEvents.filter((evt) => evt.isFollowed === true)
    }
    if (activeFeedScope === 'RECOMMENDED') {
      if (isAuthenticated && recommendationMap.size > 0) {
        return openRegistrationEvents
          .filter((evt) => recommendationMap.has(String(evt.id)))
          .sort(
            (a, b) =>
              (recommendationMap.get(String(a.id))?.rankIndex ?? Number.MAX_SAFE_INTEGER) -
              (recommendationMap.get(String(b.id))?.rankIndex ?? Number.MAX_SAFE_INTEGER)
          )
      }
      if (!isAuthenticated) {
        return openRegistrationEvents.filter((evt) => Boolean(evt.pointsReward))
      }
      return []
    }
    // DISCOVER: prioritize personalized recommended events at top, then remaining open events
    if (isAuthenticated && recommendationMap.size > 0) {
      return [...openRegistrationEvents].sort((a, b) => {
        const aRank = recommendationMap.get(String(a.id))?.rankIndex
        const bRank = recommendationMap.get(String(b.id))?.rankIndex
        if (aRank !== undefined && bRank !== undefined) return aRank - bRank
        if (aRank !== undefined) return -1
        if (bRank !== undefined) return 1
        return 0
      })
    }
    return openRegistrationEvents
  }, [openRegistrationEvents, activeFeedScope, isAuthenticated, recommendationMap])

  const isFeedLoading =
    isLoading || (activeFeedScope === 'RECOMMENDED' && isAuthenticated && isLoadingRecommendations)

  const filteredEvents = tabEvents.filter(createEventFilterMatcher(filterValues, filterOptions))

  const searchedEvents = useMemo(() => {
    if (!searchQuery.trim()) return filteredEvents
    const q = searchQuery.toLowerCase().trim()
    return filteredEvents.filter((event) => {
      const title = (event.title || '').toLowerCase()
      const org = (event.organizerName || '').toLowerCase()
      const desc = (event.description || '').toLowerCase()
      const locStr =
        typeof event.location === 'string'
          ? event.location
          : `${event.location?.address || ''} ${event.location?.city || ''}`
      const loc = locStr.toLowerCase()
      const category = (event.category || event.eventTypeName || '').toLowerCase()
      return (
        title.includes(q) ||
        org.includes(q) ||
        desc.includes(q) ||
        loc.includes(q) ||
        category.includes(q)
      )
    })
  }, [filteredEvents, searchQuery])

  // Track rendered/visible recommended cards and queue their IDs for batch view reporting
  useEffect(() => {
    if (!isAuthenticated || !viewUserKey || !feedListRef.current || isFeedLoading) return
    const cards = Array.from(
      feedListRef.current.querySelectorAll<HTMLElement>('[data-recommended="true"][data-event-id]')
    )
    if (cards.length === 0) return

    if (typeof IntersectionObserver === 'undefined') {
      const ids = cards
        .map((el) => el.dataset.eventId)
        .filter((id): id is string => Boolean(id))
      queueRecommendedEventViews(viewUserKey, ids)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds: string[] = []
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          const eventId = target.dataset.eventId
          if (eventId) {
            visibleIds.push(eventId)
          }
          observer.unobserve(target)
        }
        if (visibleIds.length > 0) {
          queueRecommendedEventViews(viewUserKey, visibleIds)
        }
      },
      { root: scrollContainerRef.current, threshold: 0.5 }
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [isAuthenticated, viewUserKey, isFeedLoading, searchedEvents, effectiveViewMode, activeTab])

  // On return to Home (with pending or in-flight views) and on exit/pagehide, flush & mark recommendations stale
  useEffect(() => {
    if (!isAuthenticated || !viewUserKey) return

    if (getPendingEventViewBatch(viewUserKey) || hasInFlightEventViewFlush(viewUserKey)) {
      void queryClient.invalidateQueries({ queryKey: ['events', 'recommendations'] })
    }

    const handlePageHide = () => {
      flushPendingEventViewsKeepalive(viewUserKey, token)
    }
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      void flushPendingEventViews(viewUserKey, (batch) =>
        eventService.recordEventViews(batch)
      ).then((result) => {
        if (result.sentCount > 0) {
          void queryClient.invalidateQueries({
            queryKey: ['events', 'recommendations'],
            refetchType: 'none',
          })
        }
      })
    }
  }, [isAuthenticated, viewUserKey, token, queryClient])

  const handleRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'feed', 'PUBLISHED'], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId)
          ? {
              ...evt,
              isRegistered: true,
              registeredCount: (evt.registeredCount || 0) + 1,
            }
          : evt
      )
    )
    queryClient.setQueriesData<Record<string, string>>(
      { queryKey: ['registrations', 'me'] },
      (old) => ({
        ...(old && !Array.isArray(old) ? old : {}),
        [String(eventId)]: 'REGISTERED',
      })
    )
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['events', 'recommendations'] })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    setNotificationMessage('Đăng ký tham gia sự kiện thành công!')
    setTimeout(() => setNotificationMessage(null), 3500)
  }

  const handleCancelRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'feed', 'PUBLISHED'], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId)
          ? {
              ...evt,
              isRegistered: false,
              registeredCount: Math.max(0, (evt.registeredCount || 1) - 1),
            }
          : evt
      )
    )
    queryClient.setQueriesData<Record<string, string>>(
      { queryKey: ['registrations', 'me'] },
      (old) => {
        if (!old || Array.isArray(old)) return old
        const next = { ...old }
        delete next[String(eventId)]
        return next
      }
    )
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['events', 'recommendations'] })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    setNotificationMessage('Đã hủy đăng ký sự kiện thành công.')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleSave = async (eventId: string) => {
    const isCurrentlySaved = storedEventIds.has(String(eventId))
    const nextSavedState = !isCurrentlySaved

    queryClient.setQueryData(['events', 'feed', 'PUBLISHED'], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId) ? { ...evt, isSaved: nextSavedState } : evt
      )
    )

    try {
      if (nextSavedState) {
        await eventService.storeEvent(eventId)
        setNotificationMessage('Đã lưu sự kiện vào danh sách đã lưu')
      } else {
        await eventService.unstoreEvent(eventId)
        setNotificationMessage('Đã xóa sự kiện khỏi danh sách đã lưu')
      }
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'feed'] })
    }
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleFollow = async (organizerId: string) => {
    const isCurrentlyFollowed = followedFanpageIds.has(String(organizerId))
    const nextState = !isCurrentlyFollowed

    queryClient.setQueryData(['events', 'feed', 'PUBLISHED'], (old: Event[] = []) =>
      old.map((evt) => (evt.organizerId === organizerId ? { ...evt, isFollowed: nextState } : evt))
    )

    try {
      if (nextState) {
        await fanpageService.followFanpage(organizerId)
      } else {
        await fanpageService.unfollowFanpage(organizerId)
      }
      queryClient.invalidateQueries({ queryKey: ['fanpages', 'sidebar'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage', organizerId] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['fanpages', 'sidebar'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* 3-Column Layout: Left sidebar flush left, Right sidebar flush right, Feed centered */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-0 md:px-6 gap-4 xl:gap-6 overflow-hidden">
        {/* Left Column: Organization Navigation & Student Tools (Figma width: 240px, pad: 16px 0 10px 0) */}
        <aside className="hidden xl:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Feed (Tabs + Event Feed Cards, centered with Figma Feed width: 680px, gap: 8px) */}
        <main
          ref={scrollContainerRef}
          data-student-scroll
          className="student-feed-scroll flex-1 min-w-0 h-full overflow-y-auto py-2.5 px-3 sm:px-4 md:px-1 flex justify-center custom-scrollbar"
        >
          {/* Feed Container with bottom breathing room when scrolled to end */}
          <div className="w-full max-w-[680px] min-w-0 flex flex-col gap-2 pb-28 sm:pb-36">
            {isMobile ? (
              /* Mobile Search & Filter Area (< 768px) */
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sự kiện, CLB..."
                    aria-label="Tìm kiếm sự kiện"
                    className="h-10 pl-9 pr-8 text-xs sm:text-sm bg-card rounded-xl border-border/80 shadow-2xs focus-visible:ring-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <EventFilterButton
                  values={filterValues}
                  onChange={setFilterValues}
                  options={filterOptions}
                  events={tabEvents}
                  hideStatusFilter
                  showLabelOnMobile
                  className="h-10 shrink-0 px-2.5 sm:px-3 rounded-xl shadow-2xs"
                />
              </div>
            ) : (
              /* Desktop Feed Filter Tabs & View switcher (>= 768px) */
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="w-auto flex-1 min-w-0">
                  <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
                </div>
                <EventFilterButton
                  values={filterValues}
                  onChange={setFilterValues}
                  options={filterOptions}
                  events={tabEvents}
                  hideStatusFilter
                  className="h-9"
                />
                <div
                  role="group"
                  aria-label="Kiểu hiển thị sự kiện"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-white p-0.5 dark:bg-card"
                >
                  <Tooltip content="Bài viết">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Bài viết"
                      aria-pressed={viewMode === 'post'}
                      onClick={() => changeView('post')}
                      className={`h-8 w-8 ${viewMode === 'post' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground'}`}
                    >
                      <PanelsTopLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Danh sách">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Danh sách"
                      aria-pressed={viewMode === 'list'}
                      onClick={() => changeView('list')}
                      className={`h-8 w-8 ${viewMode === 'list' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground'}`}
                    >
                      <LayoutList className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            )}

            <EventFilterChips
              values={filterValues}
              onChange={setFilterValues}
              options={filterOptions}
            />

            {/* Feed List (Figma gap: 8px between consecutive cards) */}
            <div
              ref={feedListRef}
              className={`flex flex-col gap-2 ${effectiveViewMode === 'post' ? 'student-post-feed' : ''}`}
            >
              {isFeedLoading && effectiveViewMode === 'list' ? (
                <div className="flex flex-col gap-2" aria-label="Đang tải danh sách sự kiện">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl border border-border/70 bg-card p-4"
                    >
                      <Skeleton className="h-28 w-20 shrink-0 rounded-lg" />
                      <div className="flex flex-1 flex-col gap-3">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isFeedLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-3.5 shadow-2xs animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-1/3 rounded" />
                          <Skeleton className="h-3 w-1/4 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-52 bg-muted rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              ) : isFeedError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-destructive/30 bg-card p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3"
                >
                  <h3 className="font-semibold text-foreground text-base">
                    Không thể tải danh sách sự kiện
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void refetchFeed()}
                    className="mt-1"
                  >
                    Thử lại
                  </Button>
                </div>
              ) : searchedEvents.length > 0 ? (
                searchedEvents.map((event) => (
                  <EventFeedCard
                    key={event.id}
                    variant={effectiveViewMode}
                    event={event}
                    onRegister={handleRegister}
                    onCancelRegister={handleCancelRegister}
                    onToggleSave={handleToggleSave}
                    onToggleFollow={handleToggleFollow}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">🎉</span>
                  <h3 className="font-semibold text-foreground text-base">
                    {searchQuery || Object.values(filterValues).some(Boolean)
                      ? 'Không có sự kiện phù hợp'
                      : 'Chưa có sự kiện trong mục này'}
                  </h3>
                  {searchQuery || Object.values(filterValues).some(Boolean) ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      {searchQuery && (
                        <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                          Xóa từ khóa
                        </Button>
                      )}
                      {Object.values(filterValues).some(Boolean) && (
                        <Button variant="outline" size="sm" onClick={() => setFilterValues({})}>
                          Xóa bộ lọc
                        </Button>
                      )}
                      <Link
                        to="/events"
                        className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold text-foreground hover:bg-muted transition-all"
                      >
                        Tìm tất cả sự kiện
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {activeFeedScope === 'RECOMMENDED'
                          ? isAuthenticated
                            ? 'Hiện chưa có sự kiện gợi ý mới nào chưa đăng ký phù hợp với tiến độ ĐRL/SV5T của bạn. Hãy xem thêm ở tab Khám phá hoặc trang Tìm kiếm.'
                            : 'Trang chủ chỉ hiển thị các sự kiện đang mở đăng ký. Đăng nhập để nhận gợi ý cá nhân hóa theo điểm rèn luyện và Sinh viên 5 tốt.'
                          : 'Trang chủ chỉ hiển thị các sự kiện đang mở đăng ký. Bạn có thể xem các sự kiện đã đóng hoặc đã kết thúc tại trang Tìm kiếm.'}
                      </p>
                      <Link
                        to="/events"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D1D5DB] dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted transition-all"
                      >
                        Tìm tất cả sự kiện
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom spacer for generous breathing room when scrolled to the end */}
            <div className="h-28 sm:h-36 w-full shrink-0" aria-hidden="true" />
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Figma width: 240px, pad: 16px 10px 0 10px) */}
        <aside className="hidden 2xl:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
