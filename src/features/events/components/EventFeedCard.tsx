import React, { useState, useMemo, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  MessageSquare,
  Share2,
  Bookmark,
  BellRing,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Event } from '../types/event.types'
import { RegisterButton } from './RegisterButton'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

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

interface EventFeedCardProps {
  event: Event
  onRegister?: (eventId: string) => void
  onCancelRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
  onToggleFollow?: (organizerId: string) => void
}

export const EventFeedCard: React.FC<EventFeedCardProps> = ({
  event,
  onRegister,
  onCancelRegister,
  onToggleSave,
  onToggleFollow,
}) => {
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFollowed, setIsFollowed] = useState(event.isFollowed ?? false)
  const [isSaved, setIsSaved] = useState(event.isSaved ?? false)
  const isInitialRegistered = Boolean(
    event.isRegistered ||
    (event.status as string) === 'REGISTERED' ||
    (event.registrationStatus && event.registrationStatus !== 'CANCELLED')
  )
  const [isRegistered, setIsRegistered] = useState(isInitialRegistered)
  const [registrationStatus, setRegistrationStatus] = useState<string | undefined>(
    event.registrationStatus || (isInitialRegistered ? 'REGISTERED' : undefined)
  )

  useEffect(() => {
    setIsFollowed(event.isFollowed ?? false)
    setIsSaved(event.isSaved ?? false)
    const registered = Boolean(
      event.isRegistered ||
      (event.status as string) === 'REGISTERED' ||
      (event.registrationStatus && event.registrationStatus !== 'CANCELLED')
    )
    setIsRegistered(registered)
    setRegistrationStatus(event.registrationStatus || (registered ? 'REGISTERED' : undefined))
  }, [event.isFollowed, event.isSaved, event.isRegistered, event.status, event.registrationStatus])

  const handleFollowClick = () => {
    setIsFollowed((prev) => !prev)
    onToggleFollow?.(event.organizerId)
  }

  const handleSaveClick = () => {
    setIsSaved((prev) => !prev)
    onToggleSave?.(event.id)
  }

  const { isLong, previewText } = useMemo(
    () => getPreviewDescription(event.description || '', 160),
    [event.description]
  )

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

  const address = event.location?.address || 'Đang cập nhật'
  const city = event.location?.city
  const locationDisplay =
    event.location?.type === 'ONLINE'
      ? 'Trực tuyến (Online stream)'
      : city && !address.includes(city)
      ? `${address}, ${city}`
      : address

  const fanpageId = event.organizerId || '1'
  const fanpageUrl = `/fanpage/${fanpageId}`
  const organizerDisplayName =
    event.organizerFullName ||
    event.fanpageFullName ||
    event.organizerName ||
    event.fanpageName ||
    'Ban Tổ Chức'

  return (
    <article className="w-full max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2.5 pb-[12px] px-0 flex flex-col gap-3 relative">
      {/* 1. Header: Organization Info & Follow CTA (Figma: FanpageInfo [680x48], pad: 4px 12px 4px 12px, gap: 12px) */}
      <div className="flex items-center justify-between gap-3 px-3 py-1 h-12">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to={fanpageUrl}
            className="shrink-0 rounded-full hover:opacity-85 transition-opacity cursor-pointer"
            title={`Xem trang ${organizerDisplayName}`}
          >
            {event.organizerAvatarUrl ? (
              <img
                src={event.organizerAvatarUrl}
                alt={organizerDisplayName}
                className="h-10 w-10 rounded-full object-cover shrink-0 border border-border/40"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {organizerDisplayName.charAt(0)}
              </div>
            )}
          </Link>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <Link
                to={fanpageUrl}
                className="font-medium text-sm leading-5 text-foreground hover:text-primary hover:underline transition-colors truncate cursor-pointer"
                title={organizerDisplayName}
              >
                {organizerDisplayName}
              </Link>
              <VerifiedBadge className="h-4 w-4 shrink-0" />
            </div>
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
              <BellRing className="h-3 w-3 shrink-0 text-primary" />
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
          <Link
            to={`/events/${event.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
          >
            {event.title}
          </Link>
        </h2>

        {event.description && (
          <div className="text-sm font-normal text-[#374151] dark:text-muted-foreground leading-[22px]">
            {isExpanded ? (
              <div className="whitespace-pre-line text-sm leading-[22px]">
                <span>{event.description}</span>{' '}
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
                <span>{event.description}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Event Poster / Media with Ambient Blurred Background & Compact Information Badge */}
      {event.bannerUrl && (
        <div className="relative w-full min-h-[380px] max-h-[620px] flex items-center justify-center overflow-hidden bg-slate-900/10 dark:bg-slate-950/40 select-none">
          {/* Ambient Blurred Backdrop reflecting poster palette */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-45 dark:opacity-35 pointer-events-none"
            style={{ backgroundImage: `url(${event.bannerUrl})` }}
          />
          {/* Soft ambient overlay for contrast */}
          <div className="absolute inset-0 bg-slate-900/15 dark:bg-black/35 backdrop-blur-2xs pointer-events-none" />

          {/* Foreground Sharp Poster Image with true proportions */}
          <Link
            to={`/events/${event.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
            className="relative z-1 max-h-[580px] w-auto max-w-full flex items-center justify-center"
          >
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="max-h-[580px] w-auto max-w-full object-contain rounded-sm shadow-md"
              loading="lazy"
            />
          </Link>

          {/* Compact Important Info Badge - Bottom Right over image (transparent frosted glass, 4 uniform rows) */}
          <div className="absolute bottom-2.5 right-2.5 z-10 max-w-[85%] sm:max-w-[280px] bg-black/70 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-2 text-white shadow-lg flex flex-col gap-1.5 text-[11px] leading-tight select-none pointer-events-auto">
            {/* Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">
                {formatDisplayDateTime(event.startTime, event.endTime)}
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
                {event.pointsReward ? (
                  event.pointsReward.split(' · ').map((benefit, i) => (
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
            <div className="flex items-start gap-2 min-w-0">
              <Gift className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 min-w-0">
                {event.pointsReward ? (
                  event.pointsReward.split(' · ').map((benefit, i) => (
                    <span key={i} className="truncate text-muted-foreground" title={benefit}>
                      {benefit}
                    </span>
                  ))
                ) : (
                  <span className="truncate text-muted-foreground">Cộng điểm rèn luyện</span>
                )}
              </div>
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
            className={`flex h-8 w-8 items-center justify-center transition-colors cursor-pointer ${
              isSaved
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-[#6B7280] hover:text-amber-500'
            }`}
            title={isSaved ? 'Đã lưu (nhấn để bỏ lưu)' : 'Lưu sự kiện'}
          >
            <Bookmark
              className={`h-6 w-6 transition-all ${
                isSaved ? 'fill-amber-500 text-amber-500 drop-shadow-xs' : ''
              }`}
            />
          </button>

          <RegisterButton
            eventId={event.id}
            eventTitle={event.title}
            isRegistered={isRegistered}
            registrationStatus={registrationStatus}
            disabled={event.status === 'CLOSED'}
            onRegisterSuccess={() => {
              setIsRegistered(true)
              setRegistrationStatus('REGISTERED')
              onRegister?.(event.id)
            }}
            onCancelSuccess={() => {
              setIsRegistered(false)
              setRegistrationStatus(undefined)
              onCancelRegister?.(event.id)
            }}
            className="min-w-[120px] whitespace-nowrap"
          />
        </div>
      </div>
    </article>
  )
}
