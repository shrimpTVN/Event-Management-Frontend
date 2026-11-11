import React, { useState, useRef, useMemo, useEffect } from 'react'
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
  Pencil,
  Pin,
  PinOff,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { EventPhotoViewerModal } from '@/features/events'
import type { FanpageFeedPost } from '../types/fanpageAdmin.types'

function getPreviewDescription(text: string, maxChars = 160) {
  if (!text) return { isLong: false, previewText: '' }

  const lines = text.split('\n')
  const hasManyLines = lines.length > 2

  let baseText = text
  if (hasManyLines) {
    baseText = lines.slice(0, 2).join('\n')
  }

  if (baseText.length > maxChars) {
    const cut = baseText.slice(0, maxChars)
    const lastSpace = cut.lastIndexOf(' ')
    const trimmed = (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()
    return { isLong: true, previewText: trimmed }
  }

  if (hasManyLines || text.length > baseText.length) {
    return { isLong: true, previewText: baseText.trimEnd() }
  }

  return { isLong: false, previewText: text }
}

interface FanpageEventFeedCardProps {
  post: FanpageFeedPost
  onViewAnalytics?: (post: FanpageFeedPost) => void
  onEdit?: (post: FanpageFeedPost) => void
  onTogglePin?: (post: FanpageFeedPost, isPinned: boolean) => void
  onToggleHide?: (post: FanpageFeedPost, isHidden: boolean) => void
}

export const FanpageEventFeedCard: React.FC<FanpageEventFeedCardProps> = ({
  post,
  onViewAnalytics,
  onEdit,
  onTogglePin,
  onToggleHide,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [isPinned, setIsPinned] = useState(Boolean(post.isPinned))
  const [isHidden, setIsHidden] = useState(Boolean(post.isHidden))
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleTogglePin = () => {
    const next = !isPinned
    setIsPinned(next)
    onTogglePin?.(post, next)
  }

  const handleToggleHide = () => {
    const next = !isHidden
    setIsHidden(next)
    onToggleHide?.(post, next)
  }

  const { isLong, previewText } = useMemo(
    () => getPreviewDescription(post.summary || '', 160),
    [post.summary]
  )

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
    <article className={cn(
    "w-full max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2.5 pb-[12px] px-0 flex flex-col gap-3 relative transition-opacity duration-200",
    isHidden && "opacity-75 hover:opacity-100"
  )}>
      {/* Pinned Banner */}
      {isPinned && (
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 -mt-2.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-t-xl">
          <Pin className="h-3.5 w-3.5 fill-blue-700 dark:fill-blue-300 rotate-45 shrink-0" />
          <span>Bài viết đã ghim</span>
        </div>
      )}
      {/* Hidden Banner */}
      {isHidden && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 -mt-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-t-xl">
          <div className="flex items-center gap-1.5">
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            <span>Bài viết đang bị ẩn (chỉ quản trị viên mới nhìn thấy)</span>
          </div>
          <button
            type="button"
            onClick={handleToggleHide}
            className="text-primary hover:underline font-semibold cursor-pointer shrink-0"
          >
            Hiện lại bài viết
          </button>
        </div>
      )}
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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Thao tác sự kiện"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-white dark:bg-card shadow-lg p-1.5 z-30 space-y-0.5 text-xs animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  onEdit?.(post)
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  handleTogglePin()
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isPinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Bỏ ghim bài viết</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Ghim bài viết</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  handleToggleHide()
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isHidden ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Hiện bài viết</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Ẩn bài viết</span>
                  </>
                )}
              </button>
              <div className="border-t border-border/60 my-1" />
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
          <div className="text-sm font-normal text-[#374151] dark:text-muted-foreground leading-[22px]">
            {isExpanded ? (
              <div className="whitespace-pre-line text-sm leading-[22px]">
                <span>{post.summary}</span>{' '}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="font-medium text-[#1B4B8A] dark:text-blue-400 hover:underline cursor-pointer inline ml-1.5"
                >
                  Thu gọn
                </button>
              </div>
            ) : isLong ? (
              <div className="whitespace-pre-line text-sm leading-[22px]">
                <span>{previewText}...</span>{' '}
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="font-medium text-[#1B4B8A] dark:text-blue-400 hover:underline cursor-pointer inline"
                >
                  Xem thêm
                </button>
              </div>
            ) : (
              <div className="whitespace-pre-line text-sm leading-[22px]">
                <span>{post.summary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Event Poster / Media with Ambient Blurred Background & Compact Information Badge */}
      {post.bannerUrl && (
        <div className="relative w-full min-h-[380px] max-h-[620px] flex items-center justify-center overflow-hidden bg-slate-900/10 dark:bg-slate-950/40 select-none">
          {/* Ambient Blurred Backdrop reflecting poster palette */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-45 dark:opacity-35 pointer-events-none"
            style={{ backgroundImage: `url(${post.bannerUrl})` }}
          />
          {/* Soft ambient overlay for contrast */}
          <div className="absolute inset-0 bg-slate-900/15 dark:bg-black/35 backdrop-blur-2xs pointer-events-none" />

          {/* Foreground Sharp Poster Image with true proportions - Click to open Photo Viewer Lightbox */}
          <button
            type="button"
            onClick={() => setIsPhotoViewerOpen(true)}
            className="relative z-1 max-h-[580px] w-auto max-w-full flex items-center justify-center cursor-pointer group hover:opacity-95 transition-opacity"
            title="Nhấn vào hình ảnh để phóng to và xem rõ chi tiết"
          >
            <img
              src={post.bannerUrl}
              alt={post.title}
              className="max-h-[580px] w-auto max-w-full object-contain rounded-sm shadow-md transition-transform duration-200 group-hover:scale-[1.008]"
              loading="lazy"
            />
          </button>

          {/* Frosted Glass Info Badge - Bottom Right over poster */}
          <div className="absolute bottom-2.5 right-2.5 z-10 max-w-[85%] sm:max-w-[280px] bg-black/70 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-2 text-white shadow-lg flex flex-col gap-1.5 text-[11px] leading-tight select-none pointer-events-auto">
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
            onClick={() => {
              if (post.bannerUrl) {
                setIsPhotoViewerOpen(true)
              }
            }}
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

      {/* Lightbox xem ảnh to rõ chuẩn Facebook với thông tin quan trọng đặt dưới phần bình luận */}
      {post.bannerUrl && (
        <EventPhotoViewerModal
          isOpen={isPhotoViewerOpen}
          onClose={() => setIsPhotoViewerOpen(false)}
          event={{
            id: post.id,
            eventId: post.eventId || post.id.replace('post-', ''),
            title: post.title,
            description: post.summary,
            bannerUrl: post.bannerUrl,
            startTime: post.startTime,
            endTime: post.endTime,
            location: post.location,
            pointsReward: post.pointsReward,
            capacity: post.capacity,
            quotaText: post.quotaText,
            organizerName: post.authorName,
            organizerAvatarUrl: post.authorAvatarUrl,
            timeAgo: post.timeAgo,
            isFollowed: true,
          }}
        />
      )}
    </article>
  )
}
