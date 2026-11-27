import {
  EventFilterButton,
  EventFilterChips,
} from '@/features/events/components/EventFilterControls'
import { eventFilterChips } from '@/features/events/utils/eventFilters'
import { Button } from '@/components/ui/button'
import { createEventFilterMatcher } from '@/features/events/utils/eventFilters'
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'
import { MobileSearchResultCard } from '@/features/events/components/MobileSearchResultCard'
import { useMobileSearchScroll } from '@/features/events/hooks/useMobileSearchScroll'
import './SearchPage.css'
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
import { userRegistrationsQueryOptions } from '@/shared/services/userRegistrations'
import { Search } from 'lucide-react'
import { fanpageSearchService } from '@/features/fanpage/services/fanpageSearchService'
import {
  FanpageSearchFilters,
  FanpageSearchResults,
} from '@/features/fanpage/components/FanpageSearchResults'

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const isPhone = useMediaQuery('(max-width: 767px)')
  const location = useLocation()
  const onScroll = useScrollActivity(isPhone)

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  // Parse filters from URL
  const keyword = searchParams.get('keyword') || searchParams.get('search') || ''
  const eventFilterKeys = [
    'academicYear',
    'semesterId',
    'eventTypeId',
    'fanpageId',
    'fanpageIds',
    'criteriaId',
    'pointCategoryId',
    'status',
    'dateHappenFrom',
    'dateHappenTo',
  ]
  const requestedTab = searchParams.get('tab')
  const tab =
    requestedTab === 'events' || requestedTab === 'fanpages' || requestedTab === 'all'
      ? requestedTab
      : location.pathname !== '/search' || eventFilterKeys.some((key) => searchParams.has(key))
        ? 'events'
        : 'all'
  const changeTab = (value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', value)
    setSearchParams(next)
  }
  const pageOrgType = searchParams.get('pageOrgType') || ''
  const pageFollowing = isAuthenticated ? searchParams.get('pageFollowing') || '' : ''
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
    () =>
      tab !== 'events'
        ? { keyword: keyword || undefined }
        : {
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
          },
    [keyword, semesterId, eventTypeId, fanpageId, tab]
  )

  // Fetch events matching search/filter
  const {
    data: rawEvents = [],
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events', 'search', filters],
    queryFn: () => eventService.getEvents(filters),
    placeholderData: isPhone ? keepPreviousData : undefined,
    staleTime: isPhone ? 30_000 : 0,
    enabled: tab !== 'fanpages',
  })

  const pagesQuery = useQuery({
    queryKey: ['fanpages', 'search', keyword],
    queryFn: () => fanpageSearchService.search(keyword),
    enabled: tab !== 'events',
    staleTime: 30_000,
  })
  const fanpages = pagesQuery.data || []
  const isPartialEvents = Boolean((rawEvents as { __failedStatuses?: string[] })?.__failedStatuses?.length)

  // Fetch followed fanpages to maintain follow state on cards
  const {
    data: followedFanpages = [],
    isError: followingError,
    isLoading: followingLoading,
  } = useQuery({
    queryKey: ['fanpages', 'search-following', user?.id],
    queryFn: () => fanpageSearchService.following(),
    enabled: isAuthenticated,
  })

  // Fetch registered events using shared user-scoped query (loads all pages, rejects on source failure)
  const { data: registeredStatusMap = {} } = useQuery(
    userRegistrationsQueryOptions(isAuthenticated, user?.id)
  )

  const registeredEventMap = useMemo(() => {
    return new Map<string, string>(Object.entries(registeredStatusMap))
  }, [registeredStatusMap])

  const followedFanpageIds = useMemo(() => {
    return new Set(followedFanpages.map((fp: any) => String(fp.id)))
  }, [followedFanpages])
  const filteredFanpages = fanpages.filter(
    (page) =>
      tab === 'all' ||
      ((!pageOrgType || page.orgType === pageOrgType) &&
        (!pageFollowing || followedFanpageIds.has(page.id) === (pageFollowing === 'yes')))
  )
  const changeFanpageFilters = (orgType: string, following: string) => {
    const next = new URLSearchParams(searchParams)
    if (orgType) next.set('pageOrgType', orgType)
    else next.delete('pageOrgType')
    if (following) next.set('pageFollowing', following)
    else next.delete('pageFollowing')
    setSearchParams(next)
  }

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
      tab !== 'events'
        ? eventsWithFollowState
        : eventsWithFollowState.filter(
            createEventFilterMatcher(
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
      tab,
    ]
  )
  const previousResults = useRef<Event[]>([])
  useEffect(() => {
    if (!isPlaceholderData && !isLoading && !isError) {
      previousResults.current = finalFilteredEvents
    }
  }, [finalFilteredEvents, isPlaceholderData, isLoading, isError])
  const displayResults =
    isPhone && isPlaceholderData ? previousResults.current : finalFilteredEvents
  const scroll = useMobileSearchScroll(
    `${location.pathname}${location.search}`,
    isPhone,
    !isLoading && !isPlaceholderData && !isError,
    displayResults.length
  )
  const visibleResults =
    tab === 'all'
      ? displayResults.slice(0, 3)
      : isPhone
        ? displayResults.slice(0, scroll.count)
        : displayResults

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
    queryClient.invalidateQueries({ queryKey: ['fanpages', 'search-following'] })
    queryClient.setQueryData(['events', 'search', filters], (old: Event[] = []) =>
      old.map((e) =>
        String(e.organizerId) === String(organizerId) ? { ...e, isFollowed: !e.isFollowed } : e
      )
    )
  }

  // Remove individual filter chip
  // Apply from modal
  const handleApplyFilterModal = (values: EventFilterFormValues) => {
    const next = new URLSearchParams(searchParams)
    eventFilterKeys.forEach((key) => next.delete(key))
    if (keyword) next.set('keyword', keyword)
    Object.entries(values).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) {
        next.set(k, v.join(','))
      } else if (v && String(v).trim()) {
        next.set(k, String(v).trim())
      }
    })
    setSearchParams(next, { replace: isPhone })
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

  const hasFilters =
    tab === 'events' && eventFilterChips(currentModalValues, filterOptions).length > 0

  return (
    <div
      className={`${isPhone ? 'mobile-search-page' : ''} w-full h-full flex flex-col overflow-hidden bg-muted/40 dark:bg-background`}
    >
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* 3-Column Layout matching HomePage */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-3 sm:px-6 gap-4 xl:gap-6 overflow-hidden">
        {/* Left Column: Organization Navigation Sidebar */}
        <aside className="hidden xl:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Search Results Feed */}
        <main
          ref={scroll.ref}
          onScroll={onScroll}
          data-student-scroll
          className="search-results-scroll flex-1 min-w-0 h-full overflow-y-auto py-3 px-1 flex justify-center custom-scrollbar"
        >
          <div className="w-full max-w-[680px] flex flex-col gap-3 pb-8 sm:pb-12">
            <div className="flex flex-col gap-3 px-1 py-1 text-left">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h1
                    className={`${isPhone ? 'sr-only' : ''} truncate font-k2d text-lg font-semibold text-foreground`}
                  >
                    {keyword ? (
                      <>
                        Kết quả cho: <span className="text-primary">"{keyword}"</span>
                      </>
                    ) : (
                      'Tìm kiếm sự kiện và fanpage'
                    )}
                  </h1>
                  {tab !== 'fanpages' && (
                    <span className="text-xs text-muted-foreground">
                      {isLoading || (isPhone && isFetching)
                        ? 'Đang tìm kiếm…'
                        : isPhone && isError
                          ? 'Chưa tải được kết quả'
                          : `${finalFilteredEvents.length} sự kiện`}
                    </span>
                  )}
                </div>
                {tab === 'events' && (
                  <EventFilterButton
                    values={currentModalValues}
                    onChange={handleApplyFilterModal}
                    options={filterOptions}
                    events={rawEvents}
                    showLabelOnMobile={isPhone}
                    className={isPhone ? 'h-11 px-3 text-sm' : ''}
                  />
                )}
              </div>
              <div className="flex gap-2" role="group" aria-label="Loại kết quả tìm kiếm">
                {(
                  [
                    ['all', 'Tất cả'],
                    ['events', 'Sự kiện'],
                    ['fanpages', 'Fanpage'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    variant="ghost"
                    aria-pressed={tab === value}
                    onClick={() => changeTab(value)}
                    className={`h-11 px-4 ${tab === value ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {tab === 'events' && (
                <EventFilterChips
                  values={currentModalValues}
                  onChange={handleApplyFilterModal}
                  options={filterOptions}
                  touchFriendly={isPhone}
                />
              )}
              {tab === 'fanpages' && (
                <FanpageSearchFilters
                  orgTypes={Array.from(
                    new Set([
                      ...fanpages
                        .map((page) => page.orgType)
                        .filter((value): value is string => Boolean(value)),
                      ...(pageOrgType ? [pageOrgType] : []),
                    ])
                  )}
                  orgType={pageOrgType}
                  following={pageFollowing}
                  authenticated={isAuthenticated && !followingError}
                  onChange={changeFanpageFilters}
                />
              )}
            </div>

            {/* Results List */}
            {tab !== 'fanpages' && (
              <div
                className="flex flex-col gap-2"
                aria-busy={(isPhone && isFetching) || undefined}
                aria-label="Kết quả tìm kiếm"
              >
                {tab === 'all' && (
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-base font-semibold">Sự kiện</h2>
                    {displayResults.length > 3 && (
                      <Button
                        variant="ghost"
                        className="h-10 text-primary"
                        onClick={() => changeTab('events')}
                      >
                        Xem tất cả sự kiện
                      </Button>
                    )}
                  </div>
                )}
                {!isError && isPartialEvents && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <span>
                      Một số trạng thái sự kiện không tải được. Kết quả hiển thị có thể chưa đầy đủ.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refetch()}
                      className="h-7 px-2.5 text-xs bg-background text-foreground"
                    >
                      Thử lại
                    </Button>
                  </div>
                )}
                {isError ? (
                  <div
                    role="alert"
                    className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center text-sm"
                  >
                    <p>Không thể tải kết quả tìm kiếm. Vui lòng thử lại.</p>
                    <Button variant="outline" onClick={() => void refetch()} className="h-11">
                      Thử lại
                    </Button>
                  </div>
                ) : isLoading ? (
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
                ) : displayResults.length > 0 ? (
                  visibleResults.map((event) =>
                    isPhone ? (
                      <MobileSearchResultCard key={event.id} event={event} />
                    ) : (
                      <EventFeedCard
                        key={event.id}
                        event={event}
                        variant="list"
                        onRegister={handleRegister}
                        onCancelRegister={handleCancelRegister}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                      />
                    )
                  )
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
                          Không có sự kiện nào khớp với từ khóa <strong>"{keyword}"</strong>
                          {hasFilters ? ' cùng các tiêu chí lọc đang chọn.' : '.'}
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
                          className={isPhone ? 'h-11 rounded-lg text-sm' : 'h-9 rounded-lg text-xs'}
                        >
                          Xóa tất cả bộ lọc
                        </Button>
                      )}
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => navigate('/')}
                        className={isPhone ? 'h-11 rounded-lg text-sm' : 'h-9 rounded-lg text-xs'}
                      >
                        Về trang chủ
                      </Button>
                    </div>
                  </div>
                )}
                {tab === 'events' &&
                  isPhone &&
                  !isError &&
                  !isLoading &&
                  displayResults.length > scroll.count && (
                    <Button
                      variant="outline"
                      disabled={isFetching}
                      className="h-11 w-full"
                      onClick={scroll.showMore}
                    >
                      Xem thêm kết quả
                    </Button>
                  )}
              </div>
            )}
            {tab !== 'events' && (
              <section className="flex flex-col gap-3" aria-label="Fanpage tìm được">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading text-base font-semibold">Fanpage</h2>
                  {tab === 'all' && fanpages.length > 3 && (
                    <Button
                      variant="ghost"
                      className="h-10 text-primary"
                      onClick={() => changeTab('fanpages')}
                    >
                      Xem tất cả fanpage
                    </Button>
                  )}
                </div>
                {followingError && (
                  <div role="alert" className="text-sm text-destructive">
                    Chưa tải được trạng thái theo dõi. Vui lòng thử lại.
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void queryClient.invalidateQueries({
                          queryKey: ['fanpages', 'search-following'],
                        })
                      }
                    >
                      Tải lại trạng thái
                    </Button>
                  </div>
                )}
                {pagesQuery.isLoading ||
                (tab === 'fanpages' && pageFollowing && followingLoading) ? (
                  <p role="status" className="py-4 text-sm text-muted-foreground">
                    Đang tìm fanpage…
                  </p>
                ) : pagesQuery.isError ? (
                  <div role="alert" className="flex items-center justify-between gap-2 text-sm">
                    <p>Không thể tải fanpage.</p>
                    <Button variant="outline" onClick={() => void pagesQuery.refetch()}>
                      Thử lại fanpage
                    </Button>
                  </div>
                ) : followingError && pageFollowing && tab === 'fanpages' ? null : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {filteredFanpages.length} fanpage
                    </p>
                    {filteredFanpages.length ? (
                      <FanpageSearchResults
                        items={tab === 'all' ? filteredFanpages.slice(0, 3) : filteredFanpages}
                        followedIds={followedFanpageIds}
                      />
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Không tìm thấy fanpage phù hợp
                      </p>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget */}
        <aside className="hidden 2xl:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
export default SearchPage
