import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, X, Users, SlidersHorizontal, CalendarPlus, Plus, RotateCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore, isStaffUser } from '@/features/auth'
import { Skeleton } from '@/components/ui/skeleton'
import {
  EventFilterModal,
  type EventFilterFormValues,
  isEventMatchingRegistrationStatus,
  eventFilterOptionsService,
  type EventFilterOptions,
} from '@/features/events'
import type {
  FanpageSummary,
  FanpageActivityStats,
  UpcomingEventReminder,
  FanpageFeedPost,
} from '../types/fanpageAdmin.types'
import { FanpageProfileHeader } from './FanpageProfileHeader'
import { FanpageQuickCreateCard } from './FanpageQuickCreateCard'
import { FanpageAboutCard } from './FanpageAboutCard'
import { FanpageActivityStatsCard } from './FanpageActivityStatsCard'
import { FanpageEventFeedCard } from './FanpageEventFeedCard'

interface FanpageHomeViewProps {
  currentFanpage: FanpageSummary
  stats: FanpageActivityStats
  reminder?: UpcomingEventReminder | null
  posts: FanpageFeedPost[]
  isLoadingPosts?: boolean
  onOpenEventsTab?: () => void
  onCreateEventClick?: () => void
  onEditProfileClick?: () => void
  onEditEvent?: (post: FanpageFeedPost) => void
  onPinEvent?: (post: FanpageFeedPost, isPinned: boolean) => void
  onHideEvent?: (post: FanpageFeedPost, isHidden: boolean) => void
}

export const FanpageHomeView: React.FC<FanpageHomeViewProps> = ({
  currentFanpage,
  stats,
  reminder,
  posts,
  isLoadingPosts = false,
  onOpenEventsTab,
  onCreateEventClick,
  onEditProfileClick,
  onEditEvent,
  onPinEvent,
  onHideEvent,
}) => {
  const navigate = useNavigate()
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<FanpageFeedPost | null>(null)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<EventFilterFormValues>({})

  const { data: filterOptions } = useQuery<EventFilterOptions>({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })

  const activeDrawerFiltersCount = useMemo(() => {
    return [
      filterValues.status,
      filterValues.eventTypeId,
      filterValues.pointCategoryId,
      filterValues.criteriaId,
      filterValues.semesterId && filterValues.semesterId !== 'ALL' ? filterValues.semesterId : null,
      filterValues.academicYear && filterValues.academicYear !== 'ALL' ? filterValues.academicYear : null,
      filterValues.dateHappenFrom,
      filterValues.dateHappenTo,
    ].filter(Boolean).length
  }, [filterValues])

  const filteredPosts = useMemo(() => {
    const rawTypeIds = filterValues.eventTypeId ? filterValues.eventTypeId.split(',').filter(Boolean) : []
    const rawStatus = filterValues.status ? filterValues.status.split(',').filter(Boolean) : []
    const rawPointCatIds = filterValues.pointCategoryId ? filterValues.pointCategoryId.split(',').filter(Boolean) : []
    const rawCritIds = filterValues.criteriaId ? filterValues.criteriaId.split(',').filter(Boolean) : []

    const selectedTypeLabels = rawTypeIds.map((tid) => {
      const found = filterOptions?.eventTypes?.find((et) => String(et.id) === String(tid))
      return (found?.label || tid).toLowerCase()
    })

    const selectedCritLabels = rawCritIds.map((cid) => {
      const found = filterOptions?.criterias?.find((c) => String(c.id) === String(cid))
      return (found?.label || cid).toLowerCase().replace('tiêu chuẩn', '').trim()
    })

    return posts.filter((post) => {
      // 1. Status Filter
      if (rawStatus.length > 0) {
        const matchesStatus = rawStatus.some((sKey) =>
          isEventMatchingRegistrationStatus(
            {
              status: post.status || 'PUBLISHED',
              dateOpen: post.dateOpen,
              dateClose: post.dateClose,
              dateHappen: post.startTime,
              startTime: post.startTime,
              endTime: post.endTime,
            } as any,
            sKey
          )
        )
        if (!matchesStatus) return false
      }

      // 2. Event Types
      if (rawTypeIds.length > 0) {
        const pTypeId = String((post as any).eventTypeId || '')
        const pTypeName = (post.eventTypeName || (post as any).category || '').toLowerCase()
        const pTitle = (post.title || '').toLowerCase()

        const matchesType =
          (pTypeId && rawTypeIds.includes(pTypeId)) ||
          selectedTypeLabels.some(
            (lbl) => lbl && (pTypeName.includes(lbl) || lbl.includes(pTypeName) || pTitle.includes(lbl))
          ) ||
          rawTypeIds.some((tid) => pTypeName.includes(tid.toLowerCase()) || pTitle.includes(tid.toLowerCase()))

        if (!matchesType) return false
      }

      // 3. Point Category (ĐRL)
      if (rawPointCatIds.length > 0) {
        const pPoints = (post as any).eventPoints || []
        const hasPointMatch = pPoints.some((ep: any) =>
          rawPointCatIds.includes(String(ep.pointCategoryId || ep.id))
        )
        if (!hasPointMatch) return false
      }

      // 4. SV5T Criteria
      if (rawCritIds.length > 0) {
        const pCritId = String((post as any).criteriaId || '')
        const pCritName = ((post as any).criteriaName || '').toLowerCase()
        const matchesCrit =
          (pCritId && rawCritIds.includes(pCritId)) ||
          selectedCritLabels.some((lbl) => lbl && pCritName && (pCritName.includes(lbl) || lbl.includes(pCritName)))

        if (!matchesCrit) return false
      }

      // 5. Semester
      if (filterValues.semesterId && filterValues.semesterId !== 'ALL') {
        const pSemId = String((post as any).semesterId || '')
        if (pSemId && pSemId !== String(filterValues.semesterId)) return false
      }

      // 6. Date Happen Range
      if (filterValues.dateHappenFrom) {
        const d = post.startTime
        if (d && d < filterValues.dateHappenFrom) return false
      }
      if (filterValues.dateHappenTo) {
        const d = post.endTime || post.startTime
        if (d && d > filterValues.dateHappenTo) return false
      }

      return true
    })
  }, [posts, filterValues, filterOptions])

  const { user } = useAuthStore()
  const isCurrentUserAdmin =
    currentFanpage.role === 'Quản trị viên' ||
    currentFanpage.role === 'ADMIN' ||
    (user ? isStaffUser(user) : false)
  const basePath = isCurrentUserAdmin ? '/fanpage/admin' : '/fanpage/workspace'

  const handleCreateEvent = onCreateEventClick
    ? onCreateEventClick
    : () => navigate(`${basePath}?tab=create-event`)

  return (
    <div className="w-full space-y-3.5 text-left">
      {/* 1. Fanpage Profile Header Card with Single 'Chỉnh sửa' Action */}
      <FanpageProfileHeader
        fanpage={currentFanpage}
        actions={
          isCurrentUserAdmin ? (
            <button
              type="button"
              onClick={onEditProfileClick ? onEditProfileClick : () => navigate(`${basePath}?tab=profile`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-[#1B4B8A] hover:bg-[#153a6b] text-white rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              <span>Chỉnh sửa</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-white dark:bg-card rounded-lg border border-border/70 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Chế độ xem</span>
            </span>
          )
        }
      />

      {/* 2. 2-Column Content Layout: Left = Card thông tin & Card tạo sự kiện, Right = Feed bài viết */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Card thông tin (Giới thiệu) + Tạo nhanh sự kiện */}
        <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-20 self-start space-y-3.5">
          <FanpageAboutCard
            fanpage={currentFanpage}
            onEditClick={
              isCurrentUserAdmin
                ? (onEditProfileClick ? onEditProfileClick : () => navigate(`${basePath}?tab=profile`))
                : undefined
            }
          />
          <FanpageQuickCreateCard
            reminder={reminder || undefined}
            onCreateEvent={handleCreateEvent}
          />
          {/* On smaller screens (below xl where right sidebar is hidden), show activity stats card here */}
          <div className="block xl:hidden">
            <FanpageActivityStatsCard stats={stats} />
          </div>
        </div>

        {/* Right Column: Sự kiện Feed */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3.5">
          {/* Section Header: Title + Button to open Events Manager */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-k2d font-medium text-lg text-foreground tracking-tight">
                Sự kiện đã đăng
              </h2>
              {activeDrawerFiltersCount > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  ({filteredPosts.length}/{posts.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-colors shadow-2xs cursor-pointer',
                  activeDrawerFiltersCount > 0
                    ? 'border-primary text-primary bg-primary/5'
                    : 'text-[#374151] dark:text-foreground bg-white dark:bg-card border border-border/80 hover:bg-muted/60'
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Bộ lọc</span>
                {activeDrawerFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-bold">
                    {activeDrawerFiltersCount}
                  </span>
                )}
              </button>

              {onOpenEventsTab && (
                <button
                  type="button"
                  onClick={onOpenEventsTab}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#374151] dark:text-foreground bg-white dark:bg-card border border-border/80 rounded-lg hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Quản lý sự kiện</span>
                </button>
              )}
            </div>
          </div>

          {/* Active filter summary bar */}
          {activeDrawerFiltersCount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
              <span className="text-primary font-medium">
                Đang áp dụng {activeDrawerFiltersCount} tiêu chí lọc ({filteredPosts.length} kết quả)
              </span>
              <button
                type="button"
                onClick={() => setFilterValues({})}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </button>
            </div>
          )}

          {/* Event Feed Posts or Empty State */}
          {isLoadingPosts ? (
            <div className="flex flex-col gap-3.5 animate-pulse">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-border/80 bg-white dark:bg-card p-5 flex flex-col gap-3.5 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-1/3 rounded" />
                      <Skeleton className="h-3 w-1/4 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {filteredPosts.map((post) => (
                <FanpageEventFeedCard
                  key={post.id}
                  post={{
                    ...post,
                    authorAvatarUrl: post.authorAvatarUrl || currentFanpage.avatarUrl,
                    authorName: currentFanpage.fullName || currentFanpage.name || post.authorName,
                  }}
                  onViewAnalytics={(p) => setSelectedPostForAnalytics(p)}
                  onEdit={onEditEvent}
                  onTogglePin={onPinEvent}
                  onToggleHide={onHideEvent}
                />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-border/90 bg-white dark:bg-card p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-3 shadow-2xs">
              <p className="text-sm font-semibold text-foreground">Không tìm thấy sự kiện phù hợp</p>
              <p className="text-xs text-muted-foreground">Hãy thử điều chỉnh lại các tiêu chí bộ lọc của bạn.</p>
              <button
                type="button"
                onClick={() => setFilterValues({})}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-border/90 bg-white dark:bg-card p-10 sm:p-12 flex flex-col items-center justify-center text-center gap-3.5 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1B4B8A] dark:text-blue-400 flex items-center justify-center">
                <CalendarPlus className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                  Chưa có sự kiện nào
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Fanpage hiện tại chưa đăng tải sự kiện nào. Hãy tạo sự kiện mới để kết nối và thu hút sinh viên tham gia!
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateEvent}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B4B8A] hover:bg-[#153a6b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo sự kiện mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Modal Drawer (when clicking 'Xem số liệu') */}
      {selectedPostForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Thống kê hiệu quả sự kiện
                </span>
                <h3 className="font-k2d font-bold text-lg text-foreground mt-0.5">
                  {selectedPostForAnalytics.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostForAnalytics(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-muted-foreground">Lượt tiếp cận</span>
                <p className="font-k2d font-bold text-xl text-foreground mt-1">2.418</p>
                <span className="text-[10px] text-emerald-600 font-medium">↑ 18% so với tuần trước</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-muted-foreground">Lượt đăng ký tham gia</span>
                <p className="font-k2d font-bold text-xl text-primary mt-1">186</p>
                <span className="text-[10px] text-muted-foreground">Chỉ tiêu: 200 sinh viên</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-muted-foreground">Tương tác bài đăng</span>
                <p className="font-k2d font-bold text-xl text-foreground mt-1">
                  {selectedPostForAnalytics.likesCount + selectedPostForAnalytics.commentsCount}
                </p>
                <span className="text-[10px] text-muted-foreground">Thích, bình luận, chia sẻ</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <span className="text-muted-foreground">Tỷ lệ điểm danh dự kiến</span>
                <p className="font-k2d font-bold text-xl text-emerald-600 mt-1">94%</p>
                <span className="text-[10px] text-muted-foreground">Dựa trên xác nhận OTP</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPostForAnalytics(null)}
                className="px-4 h-9 rounded-lg border border-border text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPostForAnalytics(null)
                  if (onOpenEventsTab) {
                    onOpenEventsTab()
                  } else {
                    navigate('/dashboard')
                  }
                }}
                className="px-4 h-9 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Quản lý danh sách sinh viên</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc Drawer */}
      <EventFilterModal
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        initialValues={filterValues}
        onApply={(values) => setFilterValues(values)}
        events={posts}
        hideFanpageFilter={true}
      />
    </div>
  )
}
