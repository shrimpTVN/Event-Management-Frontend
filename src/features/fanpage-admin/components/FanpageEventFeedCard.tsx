import React, { useState } from 'react'
import {
  Globe,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  BarChart3,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import type { FanpageFeedPost } from '../types/fanpageAdmin.types'

interface FanpageEventFeedCardProps {
  post: FanpageFeedPost
  onViewAnalytics?: (post: FanpageFeedPost) => void
}

export const FanpageEventFeedCard: React.FC<FanpageEventFeedCardProps> = ({
  post,
  onViewAnalytics,
}) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [showMenu, setShowMenu] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev
      setLikesCount((c) => (next ? c + 1 : c - 1))
      return next
    })
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2500)
  }

  return (
    <article className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border shadow-xs overflow-hidden text-left">
      {/* 1. Post Header (Figma: Đầu sự kiện [750x74]) */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-[#F9FAFB] dark:border-border/50">
        <div className="flex items-center gap-3">
          {/* Fanpage Avatar */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1B4B8A] to-[#2563EB] text-white font-k2d font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
            {post.authorAvatarText || 'CT'}
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer">
              {post.authorName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>{post.timeAgo}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span>{post.isPublic ? 'Công khai' : 'Nội bộ'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Thao tác bài viết"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-white dark:bg-card shadow-md p-1.5 z-30 space-y-0.5 text-xs">
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground cursor-pointer"
              >
                Chỉnh sửa bài viết
              </button>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground cursor-pointer"
              >
                Ghim lên đầu trang
              </button>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-destructive/10 text-destructive cursor-pointer"
              >
                Xóa bài viết
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Post Content (Figma: Nội dung sự kiện [750x74]) */}
      <div className="px-4 sm:px-5 py-3 space-y-1.5">
        <h3 className="font-k2d font-bold text-base sm:text-lg text-[#0B1626] dark:text-foreground tracking-tight leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-[#4B5563] dark:text-muted-foreground leading-relaxed">
          {post.summary}
        </p>
      </div>

      {/* 3. Event Banner / Media (Figma: Ảnh placeholder [750x214]) */}
      <div className="relative w-full aspect-[21/9] sm:h-72 bg-slate-100 dark:bg-muted/40 overflow-hidden">
        {post.bannerUrl ? (
          <img
            src={post.bannerUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
            <span className="text-xs font-medium">Ảnh sự kiện / ảnh bìa sự kiện</span>
          </div>
        )}
      </div>

      {/* 4. Engagement Stats (Figma: Thống kê tương tác [750x34]) */}
      <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-[#6B7280] dark:text-muted-foreground border-b border-[#F3F4F6] dark:border-border">
        <span className="font-medium text-foreground/80">
          {likesCount} lượt thích
        </span>
        <div className="flex items-center gap-2">
          <span>{post.commentsCount} bình luận</span>
          <span>·</span>
          <span>{post.sharesCount} lượt chia sẻ</span>
        </div>
      </div>

      {/* 5. Post Actions Row (Figma: Hành động sự kiện [750x44]) */}
      <div className="px-2 sm:px-4 py-2 flex items-center justify-between gap-1">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
            isLiked
              ? 'text-primary bg-primary/10'
              : 'text-[#4B5563] dark:text-muted-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted hover:text-foreground'
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-primary' : ''}`} />
          <span>Thích</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-[#4B5563] dark:text-muted-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Bình luận</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-[#4B5563] dark:text-muted-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {copiedShare ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600">Đã chép link</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              <span>Chia sẻ</span>
            </>
          )}
        </button>

        {/* View Analytics Button (Direct organizer insight) */}
        <button
          type="button"
          onClick={() => onViewAnalytics && onViewAnalytics(post)}
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Xem số liệu</span>
          <span className="sm:hidden">Số liệu</span>
        </button>
      </div>
    </article>
  )
}
