import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, X, Users, SlidersHorizontal, CalendarPlus, Plus } from 'lucide-react'
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
  onOpenEventsTab,
  onCreateEventClick,
  onEditProfileClick,
  onEditEvent,
  onPinEvent,
  onHideEvent,
}) => {
  const navigate = useNavigate()
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<FanpageFeedPost | null>(null)

  const handleCreateEvent = onCreateEventClick
    ? onCreateEventClick
    : () => navigate('/fanpage/admin?tab=create-event')

  return (
    <div className="w-full space-y-3.5 text-left">
      {/* 1. Fanpage Profile Header Card with Single 'Chỉnh sửa' Action */}
      <FanpageProfileHeader
        fanpage={currentFanpage}
        actions={
          <button
            type="button"
            onClick={onEditProfileClick ? onEditProfileClick : () => navigate('/fanpage/admin?tab=profile')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-[#1B4B8A] hover:bg-[#153a6b] text-white rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            <span>Chỉnh sửa</span>
          </button>
        }
      />

      {/* 2. 2-Column Content Layout: Left = Card thông tin & Card tạo sự kiện, Right = Feed bài viết */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Card thông tin (Giới thiệu) + Tạo nhanh sự kiện */}
        <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-20 self-start space-y-3.5">
          <FanpageAboutCard
            fanpage={currentFanpage}
            onEditClick={onEditProfileClick ? onEditProfileClick : () => navigate('/fanpage/admin?tab=profile')}
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
            <h2 className="font-k2d font-medium text-lg text-foreground tracking-tight">
              Sự kiện đã đăng
            </h2>

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

          {/* Event Feed Posts or Empty State */}
          {posts.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {posts.map((post) => (
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
    </div>
  )
}
