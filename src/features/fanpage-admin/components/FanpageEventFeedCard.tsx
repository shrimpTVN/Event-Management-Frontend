import React, { useState, useRef, useLayoutEffect } from 'react'
import {
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  MessageSquare,
  Share2,
  BarChart3,
  MoreHorizontal,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import type { FanpageFeedPost } from '../types/fanpageAdmin.types'

interface FanpageEventFeedCardProps {
  post: FanpageFeedPost
  onViewAnalytics?: (post: FanpageFeedPost) => void
}

export const FanpageEventFeedCard: React.FC<FanpageEventFeedCardProps> = ({
  post,
  onViewAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const descRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el || !post.summary) return

    const checkOverflow = () => {
      // 2 lines with leading-5 (20px line-height) is 40px. Exceeding 42px means > 2 lines.
      setIsOverflowing(el.scrollHeight > 42)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [post.summary])

  const eventId = post.eventId || post.id.replace('post-', '')
  const locationDisplay = post.location || 'Khu II, Đại học Cần Thơ'

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/events/${eventId}`
    navigator.clipboard?.writeText(shareUrl)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2500)
  }

  // Format date time helper matching student card: "29/09/2026 · 19:30"
  const formatDisplayDateTime = (startStr?: string, endStr?: string): string => {
    if (!startStr) return 'Đang cập nhật'
    const startDate = new Date(startStr)
    if (isNaN(startDate.getTime())) return startStr

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateFormatted = `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()}`
    const startTimeFormatted = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`

    if (endStr && endStr !== startStr) {
      const endDate = new Date(endStr)
      if (!isNaN(endDate.getTime())) {
        const endTimeFormatted = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
        return `${dateFormatted} · ${startTimeFormatted} - ${endTimeFormatted}`
      }
    }
    return `${dateFormatted} · ${startTimeFormatted}`
  }

  return (
    <article className="w-full max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2.5 pb-[12px] px-0 flex flex-col gap-3 relative">
      {/* 1. Header: Fanpage Info & Admin More Actions */}
      <div className="flex items-center justify-between gap-3 px-3 py-1 h-12">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={post.authorName}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-border/40"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4B8A] text-white font-bold text-sm shrink-0">
              {post.authorName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="font-medium text-sm leading-5 text-foreground truncate"
                title={post.authorName}
              >
                {post.authorName}
              </span>
              <VerifiedBadge className="h-4 w-4 shrink-0" />
            </div>
            <span className="text-xs font-medium leading-4 text-[#4B5563] dark:text-muted-foreground">
              {post.timeAgo || 'Vừa xong'}
            </span>
          </div>
        </div>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Thao tác sự kiện"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-white dark:bg-card shadow-lg p-1.5 z-30 space-y-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  onViewAnalytics?.(post)
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Xem số liệu thống kê</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  handleShare()
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sao chép liên kết</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Title & Description (Max 2 lines, inline expandable like student card) */}
      <div className="px-3 py-0 flex flex-col gap-1.5">
        <h2 className="font-k2d font-semibold text-base leading-snug text-foreground line-clamp-2">
          {post.title}
        </h2>

        {post.summary && (
          <div className="text-sm font-normal text-[#374151] dark:text-muted-foreground leading-5">
            {isExpanded ? (
              <p>
                {post.summary}{' '}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="font-semibold text-[#1F5CA9] dark:text-blue-400 hover:underline cursor-pointer inline ml-1.5"
                >
                  Thu gọn
                </button>
              </p>
            ) : (
              <div
                ref={descRef}
                className={cn(
                  'relative text-sm font-normal text-[#374151] dark:text-muted-foreground leading-5',
                  isOverflowing && 'max-h-[40px] overflow-hidden'
                )}
              >
                {isOverflowing && (
                  <>
                    <div className="float-right h-5 w-0" />
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="float-right clear-right bg-white dark:bg-card pl-1 font-semibold text-[#1F5CA9] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center"
                    >
                      ... <span className="ml-1">Xem Thêm</span>
                    </button>
                  </>
                )}
                <span>{post.summary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Event Poster / Media with Compact Frosted-Glass Bottom-Right Information Badge */}
      {post.bannerUrl && (
        <div className="relative w-full max-h-[460px] bg-[#010101] p-1.5 flex items-center justify-center overflow-hidden">
          <img
            src={post.bannerUrl}
            alt={post.title}
            className="max-h-[440px] w-auto max-w-full object-contain"
            loading="lazy"
          />

          {/* Frosted Glass Info Badge - Bottom Right over poster */}
          <div className="absolute bottom-2.5 right-2.5 z-10 max-w-[85%] sm:max-w-[260px] bg-black/65 backdrop-blur-md border border-white/15 rounded-lg px-2.5 py-2 text-white shadow-md flex flex-col gap-1.5 text-[11px] leading-tight select-none pointer-events-auto">
            {/* Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">
                {formatDisplayDateTime(post.startTime, post.endTime)}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85" title={locationDisplay}>
                {locationDisplay}
              </span>
            </div>

            {/* Benefits */}
            <div className="flex items-start gap-2 min-w-0">
              <Gift className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2] mt-0.5" />
              <div className="flex flex-col gap-0.5 min-w-0">
                {post.pointsReward ? (
                  post.pointsReward.split(' · ').map((benefit, i) => (
                    <span key={i} className="truncate font-medium text-white/85" title={benefit}>
                      {benefit}
                    </span>
                  ))
                ) : (
                  <span className="truncate font-medium text-white/85">Cộng điểm rèn luyện</span>
                )}
              </div>
            </div>

            {/* Quota */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">
                {post.quotaText || (post.capacity ? `${post.capacity} sinh viên` : 'Không giới hạn')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback metadata if event has NO poster/banner */}
      {!post.bannerUrl && (
        <div className="px-3 py-1">
          <div className="border-t border-[#E5E7EB] dark:border-border/60 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-foreground font-medium">
                {formatDisplayDateTime(post.startTime, post.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-foreground font-medium" title={locationDisplay}>
                {locationDisplay}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Gift className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-muted-foreground">
                {post.pointsReward || 'Cộng điểm rèn luyện'}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-muted-foreground">
                {post.quotaText || (post.capacity ? `${post.capacity} sinh viên` : 'Không giới hạn')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer Actions: NO Like button ("bỏ thích"), Keep Comment, Share, and View Analytics ("giữ lại xem số liệu") */}
      <div className="px-3 pt-0 pb-0 flex items-center justify-between">
        {/* Left: Comment & Share */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer"
            title="Bình luận"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer"
            title="Chia sẻ"
          >
            {copiedShare ? (
              <Check className="h-6 w-6 text-emerald-600" />
            ) : (
              <Share2 className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Right: "Xem số liệu" (No Like button, removed Chi tiết button) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewAnalytics?.(post)}
            className="h-8 px-3 rounded-lg border border-[#1B4B8A]/30 text-[#1B4B8A] dark:text-blue-400 hover:bg-[#1B4B8A]/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Xem số liệu thống kê sự kiện"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Xem số liệu</span>
          </button>
        </div>
      </div>
    </article>
  )
}
