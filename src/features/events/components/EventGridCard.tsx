import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  Share2,
  Bookmark,
  BellRing,
} from 'lucide-react'
import type { Event } from '../types/event.types'
import { RegisterButton } from './RegisterButton'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

interface EventGridCardProps {
  event: Event
  onRegister?: (eventId: string) => void
  onCancelRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
  onToggleFollow?: (organizerId: string) => void
}

export const EventGridCard: React.FC<EventGridCardProps> = ({
  event,
  onRegister,
  onCancelRegister,
  onToggleSave,
  onToggleFollow,
}) => {
  const location = useLocation()
  const [isFollowed, setIsFollowed] = useState(event.isFollowed ?? false)
  const [isSaved, setIsSaved] = useState(event.isSaved ?? false)
  const [isRegistered, setIsRegistered] = useState(
    Boolean(event.isRegistered || (event.status as string) === 'REGISTERED')
  )

  useEffect(() => {
    setIsFollowed(event.isFollowed ?? false)
    setIsSaved(event.isSaved ?? false)
    setIsRegistered(Boolean(event.isRegistered || (event.status as string) === 'REGISTERED'))
  }, [event.isFollowed, event.isSaved, event.isRegistered, event.status])

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFollowed((prev) => !prev)
    onToggleFollow?.(event.organizerId)
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved((prev) => !prev)
    onToggleSave?.(event.id)
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

  const address = event.location?.address || 'Đại học Cần Thơ'
  const city = event.location?.city
  const locationDisplay =
    event.location?.type === 'ONLINE'
      ? 'Trực tuyến'
      : city && !address.includes(city)
      ? `${address}, ${city}`
      : address

  return (
    <article className="w-full rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2 pb-2 px-0 flex flex-col justify-between gap-2 relative transition-all duration-200 hover:shadow-md hover:border-primary/40 group">
      {/* 1. Header: Fanpage Info & Follow CTA (Tinh gọn chiều cao) */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-0 min-h-[28px]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {event.organizerAvatarUrl ? (
            <img
              src={event.organizerAvatarUrl}
              alt={event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
              className="h-6 w-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
              {(event.organizerName || event.fanpageName || 'C').charAt(0)}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="font-medium text-xs leading-none text-foreground truncate"
                title={event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
              >
                {event.organizerName || event.fanpageName || 'Ban Tổ Chức'}
              </span>
              <VerifiedBadge className="h-3 w-3 shrink-0" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-[#4B5563] dark:text-muted-foreground mt-0.5">
              {event.timeAgo || 'Vừa xong'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFollowClick}
          className={`h-5 shrink-0 whitespace-nowrap inline-flex items-center justify-center rounded text-[10px] font-medium transition-colors cursor-pointer ${
            isFollowed
              ? 'px-1.5 gap-1 bg-muted text-muted-foreground hover:bg-muted/80'
              : 'px-1.5 bg-[#EFF5FC] hover:bg-[#EFF5FC]/80 text-[#065C85] dark:bg-blue-950/40 dark:text-blue-300'
          }`}
        >
          {isFollowed ? (
            <>
              <BellRing className="h-2.5 w-2.5 shrink-0 text-primary" />
              <span>Đã theo dõi</span>
            </>
          ) : (
            <span>Theo dõi</span>
          )}
        </button>
      </div>

      {/* 2. Tiêu đề sự kiện (font K2D, hover xanh, tối đa 2 dòng) */}
      <div className="px-2.5 py-0">
        <h3 className="font-k2d font-semibold text-xs sm:text-[13px] leading-snug text-foreground hover:text-[#1F5CA9] transition-colors line-clamp-2 min-h-[2.2rem]">
          <Link
            to={`/events/${event.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
          >
            {event.title}
          </Link>
        </h3>
      </div>

      {/* 3. Event Poster với Badge thông tin kính mờ tỉ lệ 16:9 gọn gàng */}
      <div className="relative w-full aspect-[16/9] bg-[#010101] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
        <Link
          to={`/events/${event.id}`}
          state={{ from: `${location.pathname}${location.search}` }}
          className="w-full h-full flex items-center justify-center"
        >
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#162E4F]">
              <span className="text-xs font-semibold">Sự kiện Đại học Cần Thơ</span>
            </div>
          )}
        </Link>

        {/* Khung thông tin kính mờ (Frosted Glass Badge) góc dưới bên phải */}
        <div className="absolute bottom-1.5 right-1.5 z-10 max-w-[92%] bg-black/70 backdrop-blur-md border border-white/15 rounded-md px-1.5 py-1 text-white shadow-md flex flex-col gap-0.5 text-[9px] leading-tight select-none pointer-events-auto">
          {/* Thời gian */}
          <div className="flex items-center gap-1 min-w-0">
            <CalendarIcon className="h-2.5 w-2.5 text-white shrink-0 stroke-[2.2]" />
            <span className="truncate font-medium text-white/90">
              {formatDisplayDateTime(event.startTime, event.endTime)}
            </span>
          </div>

          {/* Địa điểm */}
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-2.5 w-2.5 text-white shrink-0 stroke-[2.2]" />
            <span className="truncate font-medium text-white/90" title={locationDisplay}>
              {locationDisplay}
            </span>
          </div>

          {/* Quyền lợi (ĐRL / SV5T) */}
          <div className="flex items-start gap-1 min-w-0">
            <Gift className="h-2.5 w-2.5 text-white shrink-0 stroke-[2.2] mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0">
              {event.pointsReward ? (
                event.pointsReward.split(' · ').map((benefit, i) => (
                  <span key={i} className="truncate font-medium text-white/90" title={benefit}>
                    {benefit}
                  </span>
                ))
              ) : (
                <span className="truncate font-medium text-white/90">Cộng điểm rèn luyện</span>
              )}
            </div>
          </div>

          {/* Chỉ tiêu sinh viên */}
          <div className="flex items-center gap-1 min-w-0">
            <Users className="h-2.5 w-2.5 text-white shrink-0 stroke-[2.2]" />
            <span className="truncate font-medium text-white/90">
              {event.quotaText || (event.capacity ? `${event.capacity} SV` : 'Không giới hạn')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Footer Actions (Nút Bookmark, Share và Đăng ký) */}
      <div className="px-2.5 pt-0 flex items-center justify-between">
        {/* Nút Bookmark & Share */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSaveClick}
            className={`flex h-6 w-6 items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer ${
              isSaved ? 'text-primary' : ''
            }`}
            title={isSaved ? 'Đã lưu' : 'Lưu sự kiện'}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-primary' : ''}`} />
          </button>

          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-[#6B7280] hover:text-foreground transition-colors cursor-pointer"
            title="Chia sẻ"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nút Đăng ký */}
        <div onClick={(e) => e.stopPropagation()}>
          <RegisterButton
            eventId={event.id}
            eventTitle={event.title}
            isRegistered={isRegistered}
            size="sm"
            disabled={event.status === 'CLOSED'}
            onRegisterSuccess={() => {
              setIsRegistered(true)
              onRegister?.(event.id)
            }}
            onCancelSuccess={() => {
              setIsRegistered(false)
              onCancelRegister?.(event.id)
            }}
            className="min-w-[95px] whitespace-nowrap text-xs h-7 px-2.5"
          />
        </div>
      </div>
    </article>
  )
}
