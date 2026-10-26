import React, { useState, useRef, useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Event } from '../types/event.types'
import { RegisterButton } from './RegisterButton'

interface EventFeedCardProps {
  event: Event
  onRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
  onToggleFollow?: (organizerId: string) => void
}

export const EventFeedCard: React.FC<EventFeedCardProps> = ({
  event,
  onRegister,
  onToggleSave,
  onToggleFollow,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFollowed, setIsFollowed] = useState(event.isFollowed ?? false)
  const [isSaved, setIsSaved] = useState(event.isSaved ?? false)

  const handleFollowClick = () => {
    setIsFollowed((prev) => !prev)
    onToggleFollow?.(event.organizerId)
  }

  const handleSaveClick = () => {
    setIsSaved((prev) => !prev)
    onToggleSave?.(event.id)
  }

  const descRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el || !event.description) return

    const checkOverflow = () => {
      // 2 lines with leading-5 (20px line-height) is 40px. Exceeding 42px means > 2 lines.
      setIsOverflowing(el.scrollHeight > 42)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [event.description])

  // Helper to format ISO strings cleanly into e.g. "29/09/2026 · 19:30"
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

  const address = event.location?.address || 'Đang cập nhật'
  const city = event.location?.city
  const locationDisplay =
    event.location?.type === 'ONLINE'
      ? 'Trực tuyến (Online stream)'
      : city && !address.includes(city)
      ? `${address}, ${city}`
      : address

  return (
    <article className="w-full max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2.5 pb-[12px] px-0 flex flex-col gap-3 relative">
      {/* 1. Header: Organization Info & Follow CTA (Figma: FanpageInfo [680x48], pad: 4px 12px 4px 12px, gap: 12px) */}
      <div className="flex items-center justify-between gap-3 px-3 py-1 h-12">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
              {(event.organizerName || event.fanpageName || 'CTU').charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span
              className="font-medium text-sm leading-5 text-foreground truncate"
              title={event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
            >
              {event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
            </span>
            <span className="text-xs font-medium leading-4 text-[#4B5563] dark:text-muted-foreground">
              {event.timeAgo || 'Vừa xong'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFollowClick}
          className={`h-6 shrink-0 whitespace-nowrap inline-flex items-center justify-center rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
            isFollowed
              ? 'px-2.5 gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80'
              : 'w-[68px] bg-[#EFF5FC] hover:bg-[#EFF5FC]/80 text-[#065C85] dark:bg-blue-950/40 dark:text-blue-300'
          }`}
        >
          {isFollowed ? (
            <>
              <Check className="h-3 w-3 shrink-0" />
              <span>Đã theo dõi</span>
            </>
          ) : (
            <span>Theo dõi</span>
          )}
        </button>
      </div>

      {/* 2. Title & Description (Max 2 lines, collapses naturally for 1-line titles without blank gap) */}
      <div className="px-3 py-0 flex flex-col gap-1.5">
        <h2 className="font-k2d font-semibold text-base leading-snug text-foreground hover:text-[#1F5CA9] transition-colors line-clamp-2">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h2>

        {event.description && (
          <div className="text-sm font-normal text-[#374151] dark:text-muted-foreground leading-5">
            {isExpanded ? (
              <p>
                {event.description}{' '}
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
                    {/* Spacer pushes button down to Line 2 */}
                    <div className="float-right h-5 w-0" />
                    {/* Inline "Xem Thêm" sitting directly at the end of line 2 */}
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="float-right clear-right bg-white dark:bg-card pl-1 font-semibold text-[#1F5CA9] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center"
                    >
                      ... <span className="ml-1">Xem Thêm</span>
                    </button>
                  </>
                )}
                <span>{event.description}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Event Poster / Media with Compact Bottom-Right Information Badge */}
      {event.bannerUrl && (
        <div className="relative w-full max-h-[460px] bg-[#010101] p-1.5 flex items-center justify-center overflow-hidden">
          <Link to={`/events/${event.id}`} className="w-full h-full flex items-center justify-center">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="max-h-[440px] w-auto max-w-full object-contain"
              loading="lazy"
            />
          </Link>

          {/* Compact Important Info Badge - Bottom Right over image (transparent frosted glass, 4 uniform rows) */}
          <div className="absolute bottom-2.5 right-2.5 z-10 max-w-[85%] sm:max-w-[260px] bg-black/65 backdrop-blur-md border border-white/15 rounded-lg px-2.5 py-2 text-white shadow-md flex flex-col gap-1.5 text-[11px] leading-tight select-none pointer-events-auto">
            {/* Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">{formatDisplayDateTime(event.startTime, event.endTime)}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85" title={locationDisplay}>{locationDisplay}</span>
            </div>

            {/* Benefits */}
            <div className="flex items-center gap-2 min-w-0">
              <Gift className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">{event.pointsReward || 'Cộng điểm rèn luyện'}</span>
            </div>

            {/* Quota */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">
                {event.quotaText || (event.capacity ? `${event.capacity} sinh viên` : 'Không giới hạn')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback metadata only if event has NO poster/banner */}
      {!event.bannerUrl && (
        <div className="px-3 py-1">
          <div className="border-t border-[#E5E7EB] dark:border-border/60 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {/* Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-foreground font-medium">{formatDisplayDateTime(event.startTime, event.endTime)}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-foreground font-medium" title={locationDisplay}>{locationDisplay}</span>
            </div>

            {/* Benefits */}
            <div className="flex items-center gap-2 min-w-0">
              <Gift className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-muted-foreground">{event.pointsReward || 'Cộng điểm rèn luyện'}</span>
            </div>

            {/* Quota */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-muted-foreground">
                {event.quotaText || (event.capacity ? `${event.capacity} sinh viên` : 'Không giới hạn')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer Actions (Figma: Action [680x40], pad: 0 12px 0 12px, height: 40px) */}
      <div className="px-3 pt-0 pb-0 flex items-center justify-between">
        {/* Left: Comment & Share (Figma gap: 16px) */}
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
            className="flex items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer"
            title="Chia sẻ"
          >
            <Share2 className="h-6 w-6" />
          </button>
        </div>

        {/* Right: Bookmark + Register CTA (Figma gap: 8px) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className={`flex h-8 w-8 items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer ${
              isSaved ? 'text-primary' : ''
            }`}
            title={isSaved ? 'Đã lưu' : 'Lưu sự kiện'}
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <RegisterButton
            eventId={event.id}
            eventTitle={event.title}
            isRegistered={Boolean(event.isRegistered || (event.status as string) === 'REGISTERED')}
            disabled={event.status === 'CLOSED'}
            onRegisterSuccess={() => onRegister?.(event.id)}
            className="w-[139px]"
          />
        </div>
      </div>
    </article>
  )
}
