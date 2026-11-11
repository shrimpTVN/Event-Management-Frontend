import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  MessageSquare,
  Share2,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  Send,
  ExternalLink,
  Check,
  Bookmark,
  BellRing,
  MoreHorizontal,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { DEFAULT_FANPAGES_MAP } from '../services/eventService'
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
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [resolvedAvatar, setResolvedAvatar] = useState<string | undefined>(undefined)
  const [comments, setComments] = useState<LocalComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const commentInputRef = useRef<HTMLInputElement>(null)
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const fanpageId = String(event?.organizerId || '1')

  // Resolve real avatar
  useEffect(() => {
    if (!event) return

    setIsSaved(Boolean(event.isSaved))
    setIsFollowed(Boolean(event.isFollowed))
    setZoomLevel(1)
    setComments([])
    setCommentInput('')
    setIsDescExpanded(false)
    setShowMenu(false)

    // 1. Initial check from event or default cache map
    const initialAvatar =
      event.organizerAvatarUrl ||
      DEFAULT_FANPAGES_MAP[fanpageId]?.avatarUrl ||
      (fanpageId === '7'
        ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793963013/ctu-event/fanpages/u_2_606320c599474b7d.jpg'
        : fanpageId === '1'
          ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
          : undefined)

    setResolvedAvatar(initialAvatar)

    // 2. Fetch real fanpage avatar if missing
    if (!initialAvatar && event.organizerId) {
      let isMounted = true
      apiClient
        .get(`/fanpages/${event.organizerId}`)
        .then((res: any) => {
          const fp = res?.data || res
          if (isMounted && fp?.avatarUrl) {
            setResolvedAvatar(fp.avatarUrl)
          }
        })
        .catch(() => {})

      return () => {
        isMounted = false
      }
    }
  }, [event, fanpageId])

  // Click outside to close header menu
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
      {/* ===================== KHU VỰC TRÁI: HÌNH ẢNH TO RÕ TOÀN MÀN HÌNH ===================== */}
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

        {/* Tấm ảnh chính: Hiển thị tối đa không gian, không bị che khuất */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-auto">
          <img
            src={event.bannerUrl}
            alt={event.title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[92vh] max-w-full object-contain select-none shadow-2xl rounded-sm"
          />
        </div>
      </div>

      {/* ===================== KHU VỰC PHẢI: CHI TIẾT SỰ KIỆN, BÌNH LUẬN & THÔNG TIN QUAN TRỌNG ===================== */}
      <aside className="w-full md:w-[390px] lg:w-[440px] xl:w-[460px] shrink-0 h-full flex flex-col min-h-0 bg-white dark:bg-card border-l border-border/80 text-left select-text">
        {/* 1. Header tác giả: Bỏ viền dưới, tên fanpage 2 dòng có icon xác thực cùng hàng ký tự cuối, bỏ icon công khai */}
        <div className="px-3.5 sm:px-4 pt-3 sm:pt-3.5 pb-1 flex items-center justify-between gap-3 bg-white/95 dark:bg-card/95 backdrop-blur-xs shrink-0">
          {/* Thông tin bên trái: Avatar thật, Tên thật (cho phép 2 dòng, icon xác thực cùng hàng ký tự cuối) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              to={`/fanpage/${fanpageId}`}
              className="shrink-0 rounded-full hover:opacity-85 transition-opacity"
            >
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
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
              <Link
                to={`/fanpage/${fanpageId}`}
                className="font-semibold text-sm text-foreground hover:text-primary hover:underline line-clamp-2 leading-tight"
                title={organizerDisplayName}
              >
                <span>{organizerDisplayName}</span>
                <VerifiedBadge className="h-3.5 w-3.5 inline-block align-middle ml-1 -mt-0.5" />
              </Link>
              <span className="text-xs text-muted-foreground mt-0.5">
                {event.timeAgo || formatDisplayDateTime(event.startTime)}
              </span>
            </div>
          </div>

          {/* Các nút ở trên để gọn gàng trong menu Ba Chấm (...) */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Tùy chọn khác"
              aria-label="Tùy chọn khác"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-white dark:bg-card p-1.5 shadow-xl z-50 text-left animate-in fade-in-0 zoom-in-95 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleFollow()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <BellRing className={cn('h-4 w-4 shrink-0', isFollowed && 'text-primary')} />
                  <span>{isFollowed ? 'Bỏ theo dõi Ban tổ chức' : 'Theo dõi Ban tổ chức'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleToggleSave()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Bookmark className={cn('h-4 w-4 shrink-0', isSaved && 'fill-amber-500 text-amber-500')} />
                  <span>{isSaved ? 'Bỏ lưu sự kiện này' : 'Lưu sự kiện này'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleShare()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>{copiedLink ? 'Đã sao chép liên kết' : 'Sao chép liên kết sự kiện'}</span>
                </button>

                <div className="h-px bg-border/60 my-1" />

                <Link
                  to={`/events/${eventId}`}
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Xem trang sự kiện đầy đủ</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. Nội dung cuộn: Tiêu đề (sát lên trên) + Mô tả + CARD THÔNG TIN QUAN TRỌNG + BÌNH LUẬN */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-1 pb-4 space-y-3.5">
          {/* Tiêu đề sự kiện */}
          <div className="pt-0">
            <h2 className="font-semibold text-sm sm:text-[15px] leading-snug text-foreground hover:text-primary transition-colors">
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

          {/* ========================================================================= */}
          {/* 3. CARD THÔNG TIN QUAN TRỌNG (NẰM TRÊN PHẦN BÌNH LUẬN)                  */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-card border border-border/80 rounded-xl p-3.5 text-foreground shadow-2xs flex flex-col gap-2.5 select-none">
            {/* 1. Date & Time */}
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarIcon className="h-4 w-4 text-foreground/80 dark:text-muted-foreground shrink-0 stroke-[2.2]" />
              <span className="truncate text-xs font-medium text-foreground">
                {formatDisplayDateTime(event.startTime, event.endTime)}
              </span>
            </div>

            {/* 2. Location */}
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="h-4 w-4 text-foreground/80 dark:text-muted-foreground shrink-0 stroke-[2.2]" />
              <span className="truncate text-xs font-medium text-foreground" title={locationDisplay}>
                {locationDisplay}
              </span>
            </div>

            {/* 3. Benefits / Điểm rèn luyện */}
            <div className="flex items-start gap-2.5 min-w-0">
              <Gift className="h-4 w-4 text-foreground/80 dark:text-muted-foreground shrink-0 stroke-[2.2] mt-0.5" />
              <div className="flex flex-col gap-0.5 min-w-0">
                {event.pointsReward ? (
                  event.pointsReward.split(' · ').map((benefit: string, i: number) => (
                    <span key={i} className="truncate text-xs font-medium text-foreground" title={benefit}>
                      {benefit}
                    </span>
                  ))
                ) : (
                  <span className="truncate text-xs font-medium text-foreground">Cộng điểm rèn luyện</span>
                )}
              </div>
            </div>

            {/* 4. Quota / Sức chứa */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="h-4 w-4 text-foreground/80 dark:text-muted-foreground shrink-0 stroke-[2.2]" />
              <span className="truncate text-xs font-medium text-foreground">
                {event.quotaText || (event.capacity ? `${event.capacity} sinh viên` : 'Không giới hạn')}
              </span>
            </div>

            {/* Các nút hành động: Đăng ký + Xem trang sự kiện */}
            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
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
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border/80 hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                <span>Xem trang sự kiện đầy đủ</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* ===================== KHU VỰC BÌNH LUẬN (ĐÃ BỎ VIỀN CHỖ CHƯA CÓ BÌNH LUẬN) ===================== */}
          <div className="pt-3 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Bình luận</span>
              <span className="text-[11px] text-muted-foreground">Phù hợp nhất</span>
            </div>

            {/* Trạng thái bình luận: Trống hoặc danh sách (Bỏ viền) */}
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-muted flex items-center justify-center mb-2 text-muted-foreground/60">
                  <MessageSquare className="h-5 w-5 stroke-[1.5]" />
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
        </div>
      </aside>
    </div>
  )
}
