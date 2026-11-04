import React, { useState, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  EventFeedCard,
  eventService,
  EventFilterModal,
  eventFilterOptionsService,
  type Event,
  type EventFilterFormValues,
} from '@/features/events'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Calendar,
  Layers,
  UserCheck,
  Award,
  Flag,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  // Parse filters from URL
  const keyword = searchParams.get('keyword') || searchParams.get('search') || ''
  const academicYear = searchParams.get('academicYear') || undefined
  const semesterId = searchParams.get('semesterId') ? Number(searchParams.get('semesterId')) : undefined
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

  // Active filter payload
  const filters = useMemo(
    () => ({
      keyword: keyword || undefined,
      semesterId,
      eventTypeId: eventTypeId?.includes(',') ? undefined : (eventTypeId ? Number(eventTypeId) : undefined),
      fanpageId,
      criteriaId: criteriaId?.includes(',') ? undefined : (criteriaId ? Number(criteriaId) : undefined),
      pointCategoryId: pointCategoryId?.includes(',') ? undefined : (pointCategoryId ? Number(pointCategoryId) : undefined),
      status: status?.includes(',') ? undefined : status,
      dateHappenFrom,
      dateHappenTo,
    }),
    [keyword, semesterId, eventTypeId, fanpageId, criteriaId, pointCategoryId, status, dateHappenFrom, dateHappenTo]
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

  const followedFanpageIds = useMemo(() => {
    return new Set(followedFanpages.map((fp: any) => String(fp.id)))
  }, [followedFanpages])

  const eventsWithFollowState = useMemo(() => {
    return rawEvents.map((evt) => ({
      ...evt,
      isFollowed: evt.isFollowed || followedFanpageIds.has(String(evt.organizerId)),
    }))
  }, [rawEvents, followedFanpageIds])

  // Filter options for labels and childIds
  const { data: filterOptions } = useQuery({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })

  // Hierarchical matching for major categories and criteria
  const finalFilteredEvents = useMemo(() => {
    let result = eventsWithFollowState

    // Multi-status filter
    if (status) {
      const statuses = status.split(',').filter(Boolean)
      result = result.filter((evt: any) => statuses.includes(evt.status))
    }

    // Multi-type filter
    if (eventTypeId) {
      const typeIds = eventTypeId.split(',').filter(Boolean)
      result = result.filter((evt: any) => {
        const tid = String(evt.eventTypeId || evt.categoryId || '')
        return typeIds.includes(tid)
      })
    }

    if (pointCategoryId && filterOptions?.pointCategories) {
      const catIdList = pointCategoryId.split(',').filter(Boolean)
      const allowedCatIds = new Set<number>()

      catIdList.forEach((cid) => {
        const found = filterOptions.pointCategories.find((pc) => String(pc.id) === String(cid))
        if (found?.childIds) {
          found.childIds.forEach((id) => allowedCatIds.add(Number(id)))
        } else {
          allowedCatIds.add(Number(cid))
        }
      })

      result = result.filter((evt: any) => {
        if (Array.isArray(evt.eventPoints) && evt.eventPoints.length > 0) {
          const hasMatch = evt.eventPoints.some((ep: any) => {
            const cid = Number(ep.pointCategoryId || ep.pointCategory?.id || ep.id)
            return allowedCatIds.has(cid)
          })
          if (hasMatch) return true
        }
        if (evt.pointCategoryId && allowedCatIds.has(Number(evt.pointCategoryId))) {
          return true
        }
        return false
      })
    }

    if (criteriaId && filterOptions?.criterias) {
      const critIdList = criteriaId.split(',').filter(Boolean)
      const allowedCritIds = new Set<number>()
      const critNames: string[] = []

      critIdList.forEach((cid) => {
        const found = filterOptions.criterias.find((c) => String(c.id) === String(cid))
        if (found?.childIds) {
          found.childIds.forEach((id) => allowedCritIds.add(Number(id)))
        } else {
          allowedCritIds.add(Number(cid))
        }
        if (found?.label) {
          critNames.push(found.label.toLowerCase().replace('tiêu chuẩn', '').trim())
        }
      })

      result = result.filter((evt: any) => {
        if (evt.criteriaId && allowedCritIds.has(Number(evt.criteriaId))) {
          return true
        }
        if (evt.criteriaName) {
          const lowerName = evt.criteriaName.toLowerCase()
          return critNames.some((cn) => cn && lowerName.includes(cn))
        }
        return false
      })
    }

    // Multi-fanpage filter
    if (fanpageIds.length > 1) {
      result = result.filter((evt: any) =>
        fanpageIds.includes(String(evt.organizerId || evt.fanpageId || ''))
      )
    }

    return result
  }, [eventsWithFollowState, status, eventTypeId, pointCategoryId, criteriaId, fanpageIds, filterOptions])

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
          ? { ...e, isRegistered: false, registeredCount: Math.max(0, (e.registeredCount || 1) - 1) }
          : e
      )
    )
    setNotificationMessage('Đã hủy đăng ký sự kiện')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleSave = async (eventId: string) => {
    const currentEvent = events.find((e) => String(e.id) === String(eventId))
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
  const handleRemoveFilter = (key: string) => {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    if (key === 'fanpageId' || key === 'fanpageIds') {
      next.delete('fanpageId')
      next.delete('fanpageIds')
    }
    if (key === 'keyword') next.delete('search')
    if (key === 'dateHappenFrom') next.delete('dateHappenTo')
    if (key === 'dateHappenTo') next.delete('dateHappenFrom')
    setSearchParams(next)
  }

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchParams(new URLSearchParams())
  }

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

  // List active filter tags for chip display
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = []
    if (keyword) chips.push({ key: 'keyword', label: `Từ khóa: "${keyword}"` })
    if (academicYear) chips.push({ key: 'academicYear', label: `Năm học: ${academicYear}` })
    if (semesterId) {
      const sem = filterOptions?.semesters.find((s) => Number(s.id) === Number(semesterId))
      const sLabel = sem?.shortLabel || sem?.label
      chips.push({ key: 'semesterId', label: sLabel ? `Học kỳ: ${sLabel}` : `Học kỳ #${semesterId}` })
    }
    if (eventTypeId) {
      const typeIds = eventTypeId.split(',')
      const labels = typeIds
        .map((id) => filterOptions?.eventTypes.find((et) => String(et.id) === id)?.label || id)
        .join(', ')
      chips.push({ key: 'eventTypeId', label: `Loại hình: ${labels}` })
    }
    if (fanpageIds.length > 0) {
      const firstFp = filterOptions?.fanpages.find((fp) => String(fp.id) === fanpageIds[0])
      const firstLabel = firstFp?.label || `Đơn vị #${fanpageIds[0]}`
      const label =
        fanpageIds.length > 1
          ? `Đơn vị: ${firstLabel} (+${fanpageIds.length - 1})`
          : `Đơn vị: ${firstLabel}`
      chips.push({ key: 'fanpageId', label })
    }
    if (criteriaId) {
      const critIds = criteriaId.split(',')
      const labels = critIds
        .map((id) => filterOptions?.criterias.find((c) => String(c.id) === id)?.label || `Tiêu chuẩn #${id}`)
        .join(', ')
      chips.push({ key: 'criteriaId', label: `SV5T: ${labels}` })
    }
    if (pointCategoryId) {
      const catIds = pointCategoryId.split(',')
      const labels = catIds
        .map((id) => filterOptions?.pointCategories.find((pc) => String(pc.id) === id)?.label || `Mục ${id}`)
        .join(', ')
      chips.push({ key: 'pointCategoryId', label: `ĐRL: ${labels}` })
    }
    if (status) {
      const statusLabels: Record<string, string> = {
        OPEN_REGISTRATION: 'Đang mở đăng ký',
        PUBLISHED: 'Sắp diễn ra',
        COMPLETED: 'Đã kết thúc',
      }
      const labels = status
        .split(',')
        .map((s) => statusLabels[s] || s)
        .join(', ')
      chips.push({ key: 'status', label: `Trạng thái: ${labels}` })
    }
    if (dateHappenFrom && dateHappenTo) {
      chips.push({ key: 'dateHappenFrom', label: `Thời gian: ${dateHappenFrom} → ${dateHappenTo}` })
    } else {
      if (dateHappenFrom) chips.push({ key: 'dateHappenFrom', label: `Từ: ${dateHappenFrom}` })
      if (dateHappenTo) chips.push({ key: 'dateHappenTo', label: `Đến: ${dateHappenTo}` })
    }
    return chips
  }, [keyword, academicYear, semesterId, eventTypeId, fanpageIds, criteriaId, pointCategoryId, status, dateHappenFrom, dateHappenTo, filterOptions])

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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
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
          <div className="w-full max-w-[680px] flex flex-col gap-3 pb-28 sm:pb-36">
            {/* Header: Title, Controls, Active Chips (Transparent, no white card frame) */}
            <div className="space-y-3 px-1 pt-1 pb-1 text-left">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <h1 className="font-k2d font-bold text-xl sm:text-2xl text-foreground">
                    {keyword ? (
                      <>
                        Kết quả cho: <span className="text-primary">"{keyword}"</span>
                      </>
                    ) : (
                      'Tất cả sự kiện lọc'
                    )}
                  </h1>
                </div>

                {/* Filter Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/80 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/70 hover:border-primary/40 shadow-2xs transition-colors cursor-pointer"
                >
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <span>Bộ lọc nâng cao</span>
                  {activeChips.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px]">
                      {activeChips.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Result Count and Active Chips */}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  Tìm thấy{' '}
                  <strong className="text-foreground font-semibold">
                    {finalFilteredEvents.length}
                  </strong>{' '}
                  sự kiện phù hợp
                </span>

                {activeChips.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs text-destructive hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Xóa bộ lọc</span>
                  </button>
                )}
              </div>

              {/* Active Filter Chips */}
              {activeChips.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                    >
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilter(chip.key)}
                        className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer"
                        title="Bỏ tiêu chí này"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Results List */}
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-48 bg-muted rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              ) : finalFilteredEvents.length > 0 ? (
                finalFilteredEvents.map((event) => (
                  <EventFeedCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegister}
                    onCancelRegister={handleCancelRegister}
                    onToggleSave={handleToggleSave}
                    onToggleFollow={handleToggleFollow}
                  />
                ))
              ) : (
                /* Empty state */
                <div className="rounded-2xl border border-border bg-white dark:bg-card p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                  <div className="h-14 w-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <Search className="h-7 w-7 stroke-[1.75]" />
                  </div>
                  <h3 className="font-k2d font-bold text-lg text-foreground mt-1">
                    Không tìm thấy sự kiện phù hợp
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    {keyword ? (
                      <>
                        Không có sự kiện nào khớp với từ khóa <strong>"{keyword}"</strong> cùng các tiêu chí lọc đang chọn.
                      </>
                    ) : (
                      'Không có sự kiện nào phù hợp với các tiêu chí lọc đã chọn.'
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    {activeChips.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-5 py-2 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom spacer for generous breathing room */}
            <div className="h-28 sm:h-36 w-full shrink-0" aria-hidden="true" />
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>

      {/* Filter Modal */}
      <EventFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialValues={currentModalValues}
        onApply={handleApplyFilterModal}
        events={rawEvents}
      />
    </div>
  )
}
export default SearchPage

