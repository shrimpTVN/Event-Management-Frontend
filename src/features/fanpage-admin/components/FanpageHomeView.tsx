import { Button } from '@/components/ui/button'
import { EventAnalyticsModal } from './EventAnalyticsModal'
import {
  EventFilterButton,
  EventFilterChips,
} from '@/features/events/components/EventFilterControls'
import { matchesEventFilters, eventFilterChips } from '@/features/events/utils/eventFilters'
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, CalendarPlus, Plus, RotateCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, isStaffUser } from '@/features/auth'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type EventFilterFormValues,
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
  onOpenEventRegistrations?: (eventId: string) => void
  statsLoading?: boolean
  onRetryStats?: () => void
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
  onOpenEventRegistrations,
  statsLoading,
  onRetryStats,
  onCreateEventClick,
  onEditProfileClick,
  onEditEvent,
  onPinEvent,
  onHideEvent,
}) => {
  const navigate = useNavigate()
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<FanpageFeedPost | null>(
    null
  )
  const [filterValues, setFilterValues] = useState<EventFilterFormValues>({})

  const { data: filterOptions } = useQuery<EventFilterOptions>({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })

  const activeDrawerFiltersCount = eventFilterChips(filterValues, filterOptions).length
  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesEventFilters(post, filterValues, filterOptions)),
    [posts, filterValues, filterOptions]
  )

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
            <Button
              type="button"
              onClick={
                onEditProfileClick ? onEditProfileClick : () => navigate(`${basePath}?tab=profile`)
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-[#1B4B8A] hover:bg-[#153a6b] text-white rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              <span>Chỉnh sửa</span>
            </Button>
          ) : null
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
                ? onEditProfileClick
                  ? onEditProfileClick
                  : () => navigate(`${basePath}?tab=profile`)
                : undefined
            }
          />
          <FanpageQuickCreateCard
            reminder={reminder || undefined}
            onCreateEvent={handleCreateEvent}
          />
          {/* On smaller screens (below xl where right sidebar is hidden), show activity stats card here */}
          <div className="block xl:hidden">
            <FanpageActivityStatsCard
              stats={stats}
              isLoading={statsLoading}
              onRetry={onRetryStats}
            />
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
              <EventFilterButton
                values={filterValues}
                onChange={setFilterValues}
                options={filterOptions}
                events={posts}
                hideFanpageFilter
              />
            </div>
          </div>

          <EventFilterChips
            values={filterValues}
            onChange={setFilterValues}
            options={filterOptions}
          />

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
              <p className="text-sm font-semibold text-foreground">
                Không tìm thấy sự kiện phù hợp
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy thử điều chỉnh lại các tiêu chí bộ lọc của bạn.
              </p>
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
                  Fanpage hiện tại chưa đăng tải sự kiện nào. Hãy tạo sự kiện mới để kết nối và thu
                  hút sinh viên tham gia!
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

      {selectedPostForAnalytics && (
        <EventAnalyticsModal
          fanpageId={currentFanpage.id}
          post={selectedPostForAnalytics}
          onClose={() => setSelectedPostForAnalytics(null)}
          onOpenRegistrations={(eventId) => {
            if (onOpenEventRegistrations) onOpenEventRegistrations(eventId)
            else navigate(`${basePath}?tab=event-detail&eventId=${encodeURIComponent(eventId)}`)
          }}
        />
      )}

      {/* Bộ lọc Drawer */}
    </div>
  )
}
