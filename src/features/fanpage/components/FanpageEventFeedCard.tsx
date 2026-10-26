import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Gift,
  Users,
  MessageCircle,
  Share2,
  Bookmark,
} from 'lucide-react'
import type { FanpagePublicEventPost } from '../types/fanpage.types'
import { RegisterButton } from '@/features/events'

interface FanpageEventFeedCardProps {
  post: FanpagePublicEventPost
  onShare?: (post: FanpagePublicEventPost) => void
  onToggleSave?: (post: FanpagePublicEventPost) => void
}

export const FanpageEventFeedCard: React.FC<FanpageEventFeedCardProps> = ({
  post,
  onShare,
  onToggleSave,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFollowing, setIsFollowing] = useState(post.isFollowingAuthor || false)
  const [isSaved, setIsSaved] = useState(post.isSaved || false)

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev)
  }

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev)
    onToggleSave?.(post)
  }

  return (
    <article className="w-full bg-white dark:bg-card border border-border/80 rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] text-left pt-2.5 pb-4 px-0 flex flex-col gap-2 relative">
      {/* 1. Post Header: Fanpage info + Follow pill */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.authorAvatarUrl}
            alt={post.authorName}
            className="h-10 w-10 rounded-full object-cover border border-border/80 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer">
              {post.authorName}
            </h4>
            <div className="text-xs text-muted-foreground mt-0.5">
              {post.timeAgo}
            </div>
          </div>
        </div>

        {/* Follow tag button */}
        <button
          type="button"
          onClick={handleToggleFollow}
          className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
            isFollowing
              ? 'bg-muted text-muted-foreground'
              : 'bg-[#EFF5FC] hover:bg-blue-100 text-[#065C85] dark:bg-blue-950/50 dark:text-blue-300'
          }`}
        >
          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>

      {/* 2. Event Content: Title + Description */}
      <div className="px-4 sm:px-5 pb-3 space-y-2">
        <h3 className="font-k2d font-semibold text-base leading-snug text-foreground hover:text-primary transition-colors">
          <Link to={`/events/${post.eventId}`}>{post.title}</Link>
        </h3>

        <div className="text-xs sm:text-sm leading-relaxed text-[#374151] dark:text-muted-foreground">
          <span>
            {isExpanded
              ? post.description
              : `${post.description.slice(0, 140)}...`}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-medium text-foreground hover:text-primary hover:underline ml-1 cursor-pointer"
          >
            {isExpanded ? 'Thu gọn' : 'Xem Thêm'}
          </button>
        </div>
      </div>

      {/* 3. Banner Image */}
      <div className="w-full overflow-hidden bg-slate-100 dark:bg-muted/40 border-y border-border/50">
        <Link to={`/events/${post.eventId}`}>
          <img
            src={post.bannerUrl}
            alt={post.title}
            className="w-full h-auto max-h-[420px] object-cover transition-transform duration-300 hover:scale-[1.01]"
          />
        </Link>
      </div>

      {/* 4. Important Information (4 detail rows) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white dark:bg-card border-b border-border/60">
        {/* Ngày tổ chức */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">
              Ngày tổ chức
            </div>
            <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">
              {post.dateHappen}
            </div>
          </div>
        </div>

        {/* Địa điểm */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">
              Địa điểm
            </div>
            <div
              className="text-xs sm:text-sm font-medium text-foreground mt-0.5 line-clamp-1"
              title={typeof post.location === 'object' && post.location !== null ? ((post.location as any).address || (post.location as any).city || 'Đại học Cần Thơ') : String(post.location || 'Đại học Cần Thơ')}
            >
              {typeof post.location === 'object' && post.location !== null
                ? ((post.location as any).address || (post.location as any).city || 'Đại học Cần Thơ')
                : String(post.location || 'Đại học Cần Thơ')}
            </div>
          </div>
        </div>

        {/* Quyền lợi */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5">
            <Gift className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">
              Quyền lợi
            </div>
            <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5 line-clamp-1" title={post.benefits}>
              {post.benefits}
            </div>
          </div>
        </div>

        {/* Số lượng */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">
              Số lượng
            </div>
            <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5">
              {post.capacityText}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Action Footer */}
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 bg-white dark:bg-card">
        {/* Left: Comments & Share */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onShare?.(post)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            {post.sharesCount ? <span>{post.sharesCount}</span> : null}
          </button>
        </div>

        {/* Right: Bookmark + Register Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            title={isSaved ? 'Đã lưu' : 'Lưu sự kiện'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <RegisterButton
            eventId={post.eventId}
            eventTitle={post.title}
            isRegistered={Boolean(post.isFollowingAuthor && false)}
            disabled={!post.canRegister}
            className="w-[139px]"
          />
        </div>
      </div>
    </article>
  )
}
