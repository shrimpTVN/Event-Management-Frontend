import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Pencil, X, Users } from 'lucide-react'
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
}

export const FanpageHomeView: React.FC<FanpageHomeViewProps> = ({
  currentFanpage,
  stats,
  reminder,
  posts,
}) => {
  const navigate = useNavigate()
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<FanpageFeedPost | null>(null)

  return (
    <div className="w-full space-y-6 text-left">
      {/* 1. Fanpage Profile Header Card with Actions */}
      <FanpageProfileHeader
        fanpage={currentFanpage}
        actions={
          <div className="flex flex-col gap-2 w-full sm:w-44">
            <Link
              to="/events"
              className="w-full h-9 px-3 rounded-xl border border-[#D1D5DB] dark:border-border text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Xem trang công khai</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate('/register/fanpage')}
              className="w-full h-9 px-3 rounded-xl bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          </div>
        }
      />

      {/* 3. 2-Column Content Layout (Figma: Bố cục bảng tin [1136x741]) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Utility Widgets (370px / 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <FanpageQuickCreateCard reminder={reminder || undefined} />
          <FanpageAboutCard
            fanpage={currentFanpage}
            onEditClick={() => navigate('/register/fanpage')}
          />
          <FanpageActivityStatsCard stats={stats} />
        </div>

        {/* Right Column: Feed of Event Posts (750px / 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {posts.map((post) => (
            <FanpageEventFeedCard
              key={post.id}
              post={post}
              onViewAnalytics={(p) => setSelectedPostForAnalytics(p)}
            />
          ))}
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
                  navigate('/dashboard')
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
