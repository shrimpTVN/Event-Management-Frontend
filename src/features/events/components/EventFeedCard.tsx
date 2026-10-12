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
    <article className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 1. Header: Organization Info & Follow CTA */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerName}
              className="h-10 w-10 rounded-full object-cover border border-border/80"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {event.organizerName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base text-foreground line-clamp-1">
              {event.organizerName}
            </span>
            <span className="text-xs text-muted-foreground">{event.timeAgo || 'Vừa xong'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFollowClick}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            isFollowed
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-brand-subtle text-primary hover:bg-primary/10'
          }`}
        >
          {isFollowed ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Đang theo dõi
            </>
          ) : (
            '+ Theo dõi'
          )}
        </button>
      </div>

      {/* 2. Title & Description */}
      <div className="px-5 pt-2 pb-3">
        <h2 className="font-bold text-base sm:text-lg text-foreground uppercase leading-snug tracking-tight hover:text-primary transition-colors">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h2>

        <div className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
          <p className={isExpanded ? '' : 'line-clamp-2'}>{event.description}</p>
          {event.description.length > 100 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 font-semibold text-primary hover:underline text-xs"
            >
              {isExpanded ? 'Thu gọn' : 'Xem Thêm'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Event Poster / Media */}
      {event.bannerUrl && (
        <div className="relative w-full overflow-hidden bg-slate-900 flex items-center justify-center">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full max-h-[520px] object-contain sm:object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* 4. Event Metadata Grid (Matches event_component.png specifications) */}
      <div className="px-5 py-4 flex flex-col gap-3 border-b border-border/60 text-sm">
        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <CalendarIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Ngày tổ chức</span>
            <span className="font-semibold text-foreground text-sm">
              {event.startTime}
              {event.endTime ? ` - ${event.endTime}` : ''}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Địa điểm</span>
            <span className="font-semibold text-foreground text-sm">
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
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Quyền lợi</span>
              <span className="font-semibold text-foreground text-sm">{event.pointsReward}</span>
            </div>
          </div>
        )}

        {/* Quota / Capacity */}
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Số lượng</span>
            <span className="font-semibold text-foreground text-sm">
              {event.quotaText || `${event.capacity} sinh viên`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Footer Actions (Comment, Share, Bookmark, Register CTA) */}
      <div className="px-5 py-3.5 flex items-center justify-between bg-card">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Bình luận"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Chia sẻ"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleSaveClick}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isSaved
                ? 'text-primary bg-brand-subtle'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={isSaved ? 'Đã lưu' : 'Lưu sự kiện'}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onRegister?.(event.id)}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </article>
  )
}
