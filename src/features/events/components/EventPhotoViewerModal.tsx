import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ThumbsUp,
  MessageSquare,
  Share2,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  Send,
  Sparkles,
  ExternalLink,
  Check,
  Bookmark,
  BellRing,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { RegisterButton } from './RegisterButton'
import { cn } from '@/shared/utils/cn'

export interface EventPhotoViewerData {
  id: string
  eventId?: string
  title: string
  description?: string
  bannerUrl: string
  startTime?: string
  endTime?: string
  formattedDateTime?: string
  location?: any
  pointsReward?: string
  capacity?: number
  quotaText?: string
  organizerName?: string
  organizerAvatarUrl?: string
  organizerId?: string
  timeAgo?: string
  isFollowed?: boolean
  isSaved?: boolean
  isRegistered?: boolean
  registrationStatus?: string
  likesCount?: number
  commentsCount?: number
  sharesCount?: number
}

interface EventPhotoViewerModalProps {
  isOpen: boolean
  onClose: () => void
  event: EventPhotoViewerData | null
  onRegister?: (eventId: string) => void
  onCancelRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
  onToggleFollow?: (organizerId: string) => void
}

interface LocalComment {
  id: string
  userName: string
  userAvatar?: string
  timeAgo: string
  content: string
}

export const EventPhotoViewerModal: React.FC<EventPhotoViewerModalProps> = ({
  isOpen,
  onClose,
  event,
  onRegister,
  onCancelRegister,
  onToggleSave,
  onToggleFollow,
}) => {
  const { user } = useAuthStore()
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(12)
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [comments, setComments] = useState<LocalComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const commentInputRef = useRef<HTMLInputElement>(null)
  const viewerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (event) {
      setIsSaved(Boolean(event.isSaved))
      setIsFollowed(Boolean(event.isFollowed))
      setLikesCount(event.likesCount ?? 14)
      setIsLiked(false)
      setZoomLevel(1)
      setComments([])
      setCommentInput('')
      setIsDescExpanded(false)
    }
  }, [event])

  // Prevent background scrolling when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const eventId = event.eventId || event.id
  const fanpageId = event.organizerId || '1'
  const organizerDisplayName = event.organizerName || 'Ban Tổ Chức'

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev
      setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
      return next
    })
  }

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev)
    onToggleSave?.(eventId)
  }

  const handleToggleFollow = () => {
    setIsFollowed((prev) => !prev)
    onToggleFollow?.(fanpageId)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/events/${eventId}`
    navigator.clipboard?.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleFocusCommentInput = () => {
    commentInputRef.current?.focus()
  }

  const handleAddComment = () => {
    const trimmed = commentInput.trim()
    if (!trimmed) return

    const newComment: LocalComment = {
      id: `c-${Date.now()}`,
      userName: user?.name || 'Bạn',
      userAvatar: user?.avatarUrl,
      timeAgo: 'Vừa xong',
      content: trimmed,
    }

    setComments((prev) => [...prev, newComment])
    setCommentInput('')
  }

  // Format date helper matching standard
  const formatDisplayDateTime = (startStr?: string, endStr?: string): string => {
    if (event.formattedDateTime) return event.formattedDateTime
    if (!startStr) return 'Đang cập nhật thời gian'
    const startDate = new Date(startStr)
    if (isNaN(startDate.getTime())) return startStr

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateFormatted = `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()}`
    const startTimeFormatted = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`

    if (endStr && endStr !== startStr) {
      const endDate = new Date(endStr)
      if (!isNaN(endDate.getTime())) {
        const isSameDay =
          startDate.getFullYear() === endDate.getFullYear() &&
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getDate() === endDate.getDate()

        if (isSameDay && endDate.getTime() > startDate.getTime()) {
          const endTimeFormatted = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
          return `${dateFormatted} · ${startTimeFormatted} - ${endTimeFormatted}`
        }
      }
    }
    return `${dateFormatted} · ${startTimeFormatted}`
  }

  const getLocationDisplay = (loc: any): string => {
    if (!loc) return 'Đang cập nhật địa điểm'
    if (typeof loc === 'string') return loc
    if (loc.type === 'ONLINE') return 'Trực tuyến (Online Stream)'
    const parts = [loc.room, loc.name, loc.address, loc.city].filter(Boolean)
    return parts.join(', ') || 'Đang cập nhật địa điểm'
  }

  const locationDisplay = getLocationDisplay(event.location)

  return (
    <div
      ref={viewerContainerRef}
      className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black text-foreground overflow-hidden select-none animate-in fade-in-0 duration-200"
    >
      {/* ===================== KHU VỰC TRÁI: HÌNH ẢNH TO RÕ TOÀN MÀN HÌNH (Giao diện chuẩn Facebook Photo Viewer) ===================== */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-[45vh] md:min-h-0 overflow-hidden">
        {/* Nút Đóng góc trên bên trái */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem ảnh"
            className="h-10 w-10 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md border border-white/10"
            title="Đóng (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thanh công cụ xem ảnh góc trên bên phải (Zoom, Fullscreen) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 text-white">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Phóng to ảnh"
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Thu nhỏ ảnh"
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          {zoomLevel !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              aria-label="Kích thước gốc"
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-xs font-semibold"
              title="Khôi phục kích thước gốc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label="Toàn màn hình"
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Tấm ảnh chính: Hiển thị tối đa không gian, không bị che khuất bất kỳ thông tin nào */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-auto">
          <img
            src={event.bannerUrl}
            alt={event.title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[92vh] max-w-full object-contain transition-transform duration-200 select-none shadow-2xl rounded-sm"
          />
        </div>
      </div>

      {/* ===================== KHU VỰC PHẢI: CHI TIẾT SỰ KIỆN, BÌNH LUẬN & THÔNG TIN QUAN TRỌNG ===================== */}
      <aside className="w-full md:w-[390px] lg:w-[440px] xl:w-[460px] shrink-0 h-full flex flex-col min-h-0 bg-white dark:bg-card border-l border-border/80 text-left select-text">
        {/* 1. Header tác giả / Ban tổ chức (Giống bài đăng Facebook) */}
        <div className="p-3.5 sm:p-4 border-b border-border/60 flex items-center justify-between gap-3 bg-white/95 dark:bg-card/95 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              to={`/fanpage/${fanpageId}`}
              className="shrink-0 rounded-full hover:opacity-85 transition-opacity"
            >
              {event.organizerAvatarUrl ? (
                <img
                  src={event.organizerAvatarUrl}
                  alt={organizerDisplayName}
                  className="h-10 w-10 rounded-full object-cover border border-border/60"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#1B4B8A] text-white font-bold text-sm flex items-center justify-center">
                  {organizerDisplayName.charAt(0)}
                </div>
              )}
            </Link>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  to={`/fanpage/${fanpageId}`}
                  className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate"
                  title={organizerDisplayName}
                >
                  {organizerDisplayName}
                </Link>
                <VerifiedBadge className="h-4 w-4 shrink-0" />
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  {isFollowed ? (
                    <>
                      <BellRing className="h-3 w-3" />
                      <span>Đã theo dõi</span>
                    </>
                  ) : (
                    <span>· Theo dõi</span>
                  )}
                </button>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {event.timeAgo || '14 giờ'} · <span>🌐</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              className={cn(
                'p-2 rounded-full transition-colors cursor-pointer',
                isSaved
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title={isSaved ? 'Đã lưu sự kiện' : 'Lưu sự kiện'}
            >
              <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Sao chép liên kết"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 2. Nội dung cuộn: Tiêu đề + Mô tả + Thống kê + Bình luận + THÔNG TIN QUAN TRỌNG */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {/* Tiêu đề sự kiện */}
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg leading-snug text-foreground hover:text-primary transition-colors">
              <Link to={`/events/${eventId}`}>{event.title}</Link>
            </h2>

            {/* Mô tả sự kiện dạng bài đăng */}
            {event.description && (
              <div className="mt-2 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {isDescExpanded || event.description.length <= 220 ? (
                  <div>
                    {event.description}
                    {event.description.length > 220 && (
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded(false)}
                        className="ml-1.5 font-medium text-primary hover:underline cursor-pointer inline"
                      >
                        Thu gọn
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {event.description.slice(0, 220)}...
                    <button
                      type="button"
                      onClick={() => setIsDescExpanded(true)}
                      className="ml-1 font-medium text-primary hover:underline cursor-pointer inline"
                    >
                      Xem thêm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hàng thống kê cảm xúc & số lượng bình luận / chia sẻ */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px]">
                👍
              </span>
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] -ml-2">
                ❤️
              </span>
              <span className="ml-1 font-medium">{likesCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{comments.length} bình luận</span>
              <span>2 lượt chia sẻ</span>
            </div>
          </div>

          {/* Thanh tương tác nhanh: Thích, Bình luận, Chia sẻ */}
          <div className="py-1 border-y border-border/60 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={handleToggleLike}
              className={cn(
                'flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                isLiked
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <ThumbsUp className={cn('h-4 w-4', isLiked && 'fill-current')} />
              <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
            </button>

            <button
              type="button"
              onClick={handleFocusCommentInput}
              className="flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Bình luận</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Chia sẻ</span>
            </button>
          </div>

          {/* ===================== KHU VỰC BÌNH LUẬN ===================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Bình luận</span>
              <span className="text-[11px] text-muted-foreground">Phù hợp nhất</span>
            </div>

            {/* Trạng thái bình luận: Trống hoặc danh sách */}
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center bg-slate-50/60 dark:bg-muted/30 rounded-xl border border-dashed border-border/70">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-card shadow-2xs border border-border/60 flex items-center justify-center mb-2.5 text-muted-foreground/60">
                  <MessageSquare className="h-6 w-6 stroke-[1.5]" />
                </div>
                <p className="font-semibold text-xs sm:text-sm text-foreground">Chưa có bình luận nào</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Hãy là người đầu tiên bình luận về sự kiện này.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {comments.map((cm) => (
                  <div key={cm.id} className="flex items-start gap-2.5 text-xs">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {cm.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-[#F0F2F5] dark:bg-muted px-3 py-2 rounded-2xl">
                        <span className="font-semibold text-foreground block">{cm.userName}</span>
                        <p className="text-foreground/90 whitespace-pre-line mt-0.5">{cm.content}</p>
                      </div>
                      <div className="flex items-center gap-3 px-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="hover:underline cursor-pointer">Thích</span>
                        <span className="hover:underline cursor-pointer">Phản hồi</span>
                        <span>{cm.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Khung nhập bình luận (Facebook style) */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Người dùng'}
                  className="h-8 w-8 rounded-full object-cover shrink-0 border border-border/60"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {(user?.name || 'Bạn').charAt(0)}
                </div>
              )}
              <div className="flex-1 relative flex items-center">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder={`Bình luận dưới tên ${user?.name || 'Bạn'}...`}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  className="w-full pl-3.5 pr-10 py-2 text-xs bg-[#F0F2F5] dark:bg-muted border border-transparent rounded-full text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:bg-white dark:focus:bg-card focus:border-border transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!commentInput.trim()}
                  className="absolute right-1.5 p-1.5 rounded-full text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer"
                  title="Gửi bình luận"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. THÔNG TIN QUAN TRỌNG NẰM TRONG ẢNH (ĐƯỢC ĐẶT DƯỚI PHẦN BÌNH LUẬN)     */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-primary/20 bg-linear-to-b from-primary/5 to-transparent dark:from-primary/10 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-primary/15">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-bold text-xs sm:text-sm text-foreground">
                  Thông tin sự kiện quan trọng
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                Chi tiết
              </span>
            </div>

            {/* Danh sách 4 thông tin cốt lõi */}
            <div className="space-y-2.5 text-xs">
              {/* 1. Thời gian */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px]">Thời gian tổ chức</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {formatDisplayDateTime(event.startTime, event.endTime)}
                  </span>
                </div>
              </div>

              {/* 2. Địa điểm */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px]">Địa điểm</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {locationDisplay}
                  </span>
                </div>
              </div>

              {/* 3. Quyền lợi / ĐRL */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <Gift className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px]">Quyền lợi tham gia</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {event.pointsReward || 'Cộng điểm rèn luyện (ĐRL)'}
                  </span>
                </div>
              </div>

              {/* 4. Sức chứa / Quota */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px]">Số lượng sinh viên</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {event.quotaText || (event.capacity ? `${event.capacity} sinh viên` : 'Không giới hạn')}
                  </span>
                </div>
              </div>
            </div>

            {/* Các nút hành động chính: Đăng ký + Xem trang chi tiết */}
            <div className="pt-2 border-t border-primary/15 flex flex-col gap-2">
              <RegisterButton
                eventId={eventId}
                eventTitle={event.title}
                isRegistered={event.isRegistered}
                registrationStatus={event.registrationStatus}
                size="md"
                className="w-full justify-center"
                onRegisterSuccess={() => onRegister?.(eventId)}
                onCancelSuccess={() => onCancelRegister?.(eventId)}
              />

              <Link
                to={`/events/${eventId}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <span>Xem trang sự kiện đầy đủ</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
