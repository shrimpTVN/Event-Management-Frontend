import React, { useState } from 'react'
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

  return (
    <article className="w-full max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card overflow-hidden shadow-xs hover:shadow-sm transition-shadow text-left py-2.5 px-0 flex flex-col gap-2">
      {/* 1. Header: Organization Info & Follow CTA (Figma: FanpageInfo [680x48], pad: 4px 12px 4px 12px, gap: 12px) */}
      <div className="flex items-center justify-between gap-3 px-3 py-1 h-12">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerName}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
              {event.organizerName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span
              className="font-medium text-sm leading-5 text-foreground truncate"
              title={event.organizerName}
            >
              {event.organizerName}
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

      {/* 2. Title & Description (Figma: Event Content [680x132], pad: 0 12px 0 12px, gap: 8px) */}
      <div className="px-3 py-0 flex flex-col gap-2">
        <h2 className="font-k2d font-semibold text-base leading-7 text-foreground uppercase hover:text-[#1F5CA9] transition-colors min-h-[56px] line-clamp-2">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h2>

        <div className="text-sm font-normal text-[#374151] dark:text-muted-foreground leading-5">
          {isExpanded ? event.description : `${event.description.slice(0, 140)}...`}
        </div>

        {event.description.length > 100 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start text-sm font-medium leading-5 text-foreground hover:underline hover:text-primary cursor-pointer"
          >
            {isExpanded ? 'Thu gọn' : 'Xem Thêm'}
          </button>
        )}
      </div>

      {/* 3. Event Poster / Media (Figma: Component 6 [680x585], fill: #010101, pad: 10px 10px 10px 10px) */}
      {event.bannerUrl && (
        <div className="relative w-full h-[585px] bg-[#010101] p-2.5 flex items-center justify-center overflow-hidden">
          <Link to={`/events/${event.id}`} className="w-full h-full flex items-center justify-center">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="max-h-[565px] w-auto max-w-full object-contain transition-transform duration-300 hover:scale-[1.01]"
              loading="lazy"
            />
          </Link>
        </div>
      )}

      {/* 4. Event Metadata (Figma: Important_Infor [680x154], stroke: #E5E7EB, pad: 0 12px 0 12px) */}
      <div className="px-3 py-0">
        <div className="border-t border-[#E5E7EB] dark:border-border/60 py-2 flex flex-col gap-3 text-sm">
          {/* Date & Time */}
          <div className="h-[38px] flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#0070A5] dark:text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 justify-center min-w-0">
              <span className="text-xs font-medium leading-4 text-[#9CA3AF]">Ngày tổ chức</span>
              <span className="font-medium text-sm leading-5 text-[#374151] dark:text-foreground truncate">
                {event.startTime}
                {event.endTime ? ` - ${event.endTime}` : ''}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="h-[38px] flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#0070A5] dark:text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 justify-center min-w-0">
              <span className="text-xs font-medium leading-4 text-[#9CA3AF]">Địa điểm</span>
              <span className="font-medium text-sm leading-5 text-[#374151] dark:text-foreground truncate">
                {event.location.type === 'ONLINE'
                  ? 'Trực tuyến (Online stream)'
                  : `${event.location.address || ''}${
                      event.location.city ? `, ${event.location.city}` : ''
                    }`}
              </span>
            </div>
          </div>

          {/* Benefits / Training Points */}
          {event.pointsReward && (
            <div className="h-[38px] flex items-center gap-3">
              <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#0070A5] dark:text-blue-400">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5 justify-center min-w-0">
                <span className="text-xs font-medium leading-4 text-[#9CA3AF]">Quyền lợi</span>
                <span className="font-medium text-sm leading-5 text-[#374151] dark:text-foreground truncate">
                  {event.pointsReward}
                </span>
              </div>
            </div>
          )}

          {/* Quota / Capacity */}
          <div className="h-[38px] flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[#0070A5] dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 justify-center min-w-0">
              <span className="text-xs font-medium leading-4 text-[#9CA3AF]">Số lượng</span>
              <span className="font-medium text-sm leading-5 text-[#374151] dark:text-foreground truncate">
                {event.quotaText || `${event.capacity} sinh viên`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer Actions (Figma: Action [680x40], pad: 0 12px 0 12px, height: 40px) */}
      <div className="px-3 py-0 h-10 flex items-center justify-between">
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

          <button
            type="button"
            onClick={() => onRegister?.(event.id)}
            className="w-[139px] h-8 inline-flex items-center justify-center px-4 text-sm font-semibold text-white bg-[#1F5CA9] hover:bg-[#1B4B8A] rounded-[6px] transition-colors shadow-2xs cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </article>
  )
}
