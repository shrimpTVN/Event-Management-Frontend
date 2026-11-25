import { ShareEventButton } from './ShareEventButton'
import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { TextTooltip } from '@/components/ui/text-tooltip'
import { PosterBackdrop } from './PosterBackdrop'
import { useEventBenefitLines } from './useEventBenefitLines'
import { RegistrationDeadline, useRegistrationDeadline } from './RegistrationDeadline'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Users,
  MessageSquare,
  Bookmark,
  BellRing,
  BellOff,
  MoreHorizontal,
  X,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Event } from '../types/event.types'
import { RegisterButton } from './RegisterButton'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { EventPhotoViewerModal } from './EventPhotoViewerModal'
import { EventListItem } from './EventListItem'

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

function renderSafeTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

const MobileEventDescription: React.FC<{ description?: string }> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el || !description) return

    const checkOverflow = () => {
      if (!isExpanded) {
        setIsClamped(el.scrollHeight > el.clientHeight + 1)
      }
    }

    checkOverflow()

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => {
        checkOverflow()
      })
      observer.observe(el)

      return () => observer.disconnect()
    }
  }, [description, isExpanded])

  if (!description) return null

  return (
    <div className="px-3.5 sm:px-4 text-sm font-normal text-[#374151] dark:text-muted-foreground leading-[22px]">
      <div
        ref={textRef}
        className={`whitespace-pre-line break-words text-sm leading-[22px] ${!isExpanded ? 'line-clamp-3' : ''}`}
      >
        {renderSafeTextWithLinks(description)}
      </div>
      {isClamped && !isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(true)
          }}
          className="font-medium text-primary hover:underline cursor-pointer text-sm inline-block mt-0.5"
        >
          Xem thêm
        </button>
      )}
      {isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
          className="font-medium text-primary hover:underline cursor-pointer text-sm inline-block mt-0.5"
        >
          Thu gọn
        </button>
      )}
    </div>
  )
}

interface EventFeedCardProps {
  variant?: 'post' | 'list'
  event: Event
  onRegister?: (eventId: string) => void
  onCancelRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
  onToggleFollow?: (organizerId: string) => void
}

export const EventFeedCard: React.FC<EventFeedCardProps> = ({
  variant = 'post',
  event,
  onRegister,
  onCancelRegister,
  onToggleSave,
  onToggleFollow,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isPhone = useMediaQuery('(max-width: 767px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false)
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

  const eventTypeDisplay = useMemo(() => {
    return (
      event.eventTypeName || (event.category && event.category !== 'OTHER' ? event.category : null)
    )
  }, [event.eventTypeName, event.category])

  const benefitLines = useEventBenefitLines(
    event.pointsReward,
    event.criteriaId,
    event.criteriaName,
    event.eventPoints
  )

  const closeInfo = useRegistrationDeadline(
    event.dateClose || (event as Event & { registrationEndDate?: string }).registrationEndDate,
    event.status
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

  const [imageError, setImageError] = useState(false)

  const isFinished =
    event.status === 'FINISHED' ||
    event.status === 'COMPLETED' ||
    (event.endTime ? new Date(event.endTime).getTime() < Date.now() : false)
  const isCancelled = event.status === 'CANCELLED'
  const isClosedRegistration =
    !isRegistered &&
    (closeInfo.isClosed ||
      event.status === 'CLOSED_REGISTRATION' ||
      event.status === 'CLOSED') &&
    !isFinished &&
    !isCancelled
  const isFull =
    !isRegistered &&
    !isClosedRegistration &&
    !isFinished &&
    !isCancelled &&
    event.capacity > 0 &&
    (event.registeredCount || 0) >= event.capacity

  const mobileStatusBadge = useMemo(() => {
    if (isCancelled) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
          Đã hủy
        </span>
      )
    }
    if (isFinished) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/70">
          Đã kết thúc
        </span>
      )
    }
    if (isRegistered) {
      const regLabel =
        registrationStatus === 'CHECKED_IN'
          ? 'Đang tham gia'
          : registrationStatus === 'COMPLETED'
            ? 'Đã hoàn thành'
            : registrationStatus === 'PENDING'
              ? 'Chờ duyệt'
              : registrationStatus === 'REJECTED'
                ? 'Bị từ chối'
                : 'Đã đăng ký'
      const isPending = registrationStatus === 'PENDING'
      const isRej = registrationStatus === 'REJECTED'
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPending
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50'
            : isRej
              ? 'bg-red-500/10 text-red-600 border border-red-200/50'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
            }`}
        >
          {regLabel}
        </span>
      )
    }
    if (isFull) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50">
          Đã đủ chỗ
        </span>
      )
    }
    if (isClosedRegistration) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/70">
          Đã đóng đăng ký
        </span>
      )
    }
    if (closeInfo.isUrgent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50">
          <Clock className="h-3 w-3" />
          {closeInfo.countdown}
        </span>
      )
    }
    return null
  }, [
    isCancelled,
    isFinished,
    isRegistered,
    registrationStatus,
    isFull,
    isClosedRegistration,
    closeInfo.isUrgent,
    closeInfo.countdown,
  ])

  const mobilePrimaryButton = useMemo(() => {
    if (isCancelled || isFinished || isClosedRegistration || isFull) {
      return (
        <Button
          variant="outline"
          onClick={() => navigate(`/events/${event.id}`)}
          className="w-full h-11 rounded-lg font-semibold text-sm border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
        >
          Xem chi tiết
        </Button>
      )
    }

    if (isRegistered) {
      return (
        <Button
          onClick={() => navigate('/history')}
          className="w-full h-11 rounded-lg font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all cursor-pointer shadow-xs"
        >
          Xem đăng ký
        </Button>
      )
    }

    // Đang nhận đăng ký:
    return (
      <RegisterButton
        eventId={event.id}
        eventTitle={event.title}
        dateClose={event.dateClose}
        isRegistered={isRegistered}
        registrationStatus={registrationStatus}
        disabled={false}
        label="Đăng ký tham gia"
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
        size="md"
        className="w-full h-11 rounded-lg text-sm font-semibold shadow-xs bg-[#1F5CA9] hover:bg-[#1B4B8A] text-white"
      />
    )
  }, [
    isCancelled,
    isFinished,
    isClosedRegistration,
    isFull,
    isRegistered,
    registrationStatus,
    event.id,
    event.title,
    onRegister,
    onCancelRegister,
  ])

  const fanpageId = event.organizerId || '1'
  const fanpageUrl = `/fanpage/${fanpageId}`
  const organizerDisplayName =
    event.organizerFullName ||
    event.fanpageFullName ||
    event.organizerName ||
    event.fanpageName ||
    'Ban Tổ Chức'
  const nameBreak = organizerDisplayName.lastIndexOf(' ')
  const namePrefix = nameBreak < 0 ? '' : organizerDisplayName.slice(0, nameBreak + 1)
  const nameLastWord = organizerDisplayName.slice(nameBreak + 1)

  const registrationAction = (
    <RegisterButton
      eventId={event.id}
      eventTitle={event.title}
      dateClose={event.dateClose}
      isRegistered={isRegistered}
      registrationStatus={registrationStatus}
      disabled={
        closeInfo.isClosed || (event.capacity > 0 && event.registeredCount >= event.capacity)
      }
      disabledReason={closeInfo.isClosed ? 'closed' : 'full'}
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
      size={variant === 'list' ? 'sm' : 'md'}
      compact={isPhone && variant !== 'list'}
      className={
        isPhone && variant !== 'list'
          ? 'w-full min-w-0 whitespace-nowrap'
          : 'min-w-[120px] whitespace-nowrap'
      }
    />
  )

  if (variant === 'list') {
    return (
      <EventListItem
        event={{ ...event, isSaved, isRegistered, registrationStatus }}
        organizerName={organizerDisplayName}
        dateTime={formatDisplayDateTime(event.startTime, event.endTime)}
        location={locationDisplay}
        benefits={benefitLines}
        deadline={closeInfo}
        onSave={handleSaveClick}
        registrationAction={registrationAction}
      />
    )
  }

  if (isPhone) {
    return (
      <article
        data-event-id={event.id}
        data-recommended={event.isRecommended ? 'true' : undefined}
        className="student-feed-card w-full min-w-0 max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-3 pb-3 px-0 flex flex-col gap-3 relative"
      >
        {/* 1. Header: Avatar tròn, tên đơn vị tổ chức, thời gian đăng, menu ⋯ */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Tooltip content={`Xem trang ${organizerDisplayName}`}>
              <Link
                to={fanpageUrl}
                className="shrink-0 rounded-full hover:opacity-85 transition-opacity cursor-pointer"
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
            </Tooltip>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <Tooltip content={organizerDisplayName}>
                <Link
                  to={fanpageUrl}
                  aria-label={organizerDisplayName}
                  className="block font-semibold text-sm leading-5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {namePrefix}
                  <span className="whitespace-nowrap">
                    {nameLastWord}
                    <VerifiedBadge className="ml-1 h-3.5 w-3.5 align-[-2px]" />
                  </span>
                </Link>
              </Tooltip>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-medium leading-4 text-muted-foreground">
                  {event.timeAgo || 'Vừa xong'}
                </span>
                {(event.recommendationExplain || event.isRecommended) && (
                  <Tooltip content={event.recommendationExplain || 'Sự kiện gợi ý phù hợp với bạn'}>
                    <span
                      aria-label="Lý do gợi ý sự kiện"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-muted-foreground"
                aria-label="Tùy chọn bài viết"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-2xs" />
              <Dialog.Content className="fixed inset-x-0 bottom-0 z-[71] flex flex-col gap-2 rounded-t-2xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground shadow-2xl">
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-border/50">
                  <Dialog.Title className="font-semibold text-sm">Tùy chọn bài viết</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      aria-label="Đóng tùy chọn"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Thao tác với bài viết và fanpage tổ chức.
                </Dialog.Description>
                <Button
                  variant="ghost"
                  className="h-12 justify-start gap-3 text-sm font-medium"
                  onClick={() => {
                    handleFollowClick()
                    setMenuOpen(false)
                  }}
                >
                  {isFollowed ? (
                    <BellOff className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <BellRing className="h-5 w-5 shrink-0 text-primary" />
                  )}
                  <span>{isFollowed ? 'Bỏ theo dõi fanpage' : 'Theo dõi fanpage'}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 justify-start gap-3 text-sm font-medium"
                  onClick={() => {
                    handleSaveClick()
                    setMenuOpen(false)
                  }}
                >
                  <Bookmark
                    className={`h-5 w-5 shrink-0 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}
                  />
                  <span>{isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}</span>
                </Button>
                <Link
                  to={fanpageUrl}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium hover:bg-muted"
                >
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Xem fanpage</span>
                </Link>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* 2. Event title first, followed by the collapsible description. */}
        <h2 className="px-3.5 sm:px-4 font-k2d font-semibold text-base leading-snug text-foreground hover:text-primary transition-colors line-clamp-2">
          <Link
            to={`/events/${event.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
          >
            {event.title}
          </Link>
        </h2>
        {(eventTypeDisplay || mobileStatusBadge) && (
          <div role="group" aria-label="Thể loại và trạng thái sự kiện" className="flex min-w-0 flex-wrap items-center gap-2 px-3.5 sm:px-4">
            {eventTypeDisplay && (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="break-words">{eventTypeDisplay}</span>
              </span>
            )}
            {mobileStatusBadge}
          </div>
        )}
        <MobileEventDescription description={event.description} />

        {/* 3. Ảnh sự kiện: Trải hết chiều ngang card, max-h 4:5 ratio, click mở photo viewer */}
        {event.bannerUrl && !imageError && (
          <div className="relative w-full max-h-[500px] flex items-center justify-center overflow-hidden bg-muted/30 dark:bg-black/40 select-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsPhotoViewerOpen(true)
              }}
              className="w-full h-full flex items-center justify-center cursor-pointer"
              aria-label="Xem ảnh sự kiện to rõ"
            >
              <img
                src={event.bannerUrl}
                alt={event.title}
                onError={() => setImageError(true)}
                className="w-full max-h-[500px] object-contain"
                loading="lazy"
              />
            </button>
          </div>
        )}

        {/* 4. Event schedule, location and benefits. */}
        <div className="px-3.5 sm:px-4 flex flex-col gap-2">
          {/* Details */}
          <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium text-foreground">
                {formatDisplayDateTime(event.startTime, event.endTime)}
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium text-foreground">{locationDisplay}</span>
            </div>

            {benefitLines.length > 0 && (
              <div className="flex items-start gap-2 min-w-0">
                <Gift className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  {benefitLines.map((benefit, i) => (
                    <span key={i} className="truncate font-medium text-muted-foreground">
                      {benefit.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium text-muted-foreground">
                {event.capacity > 0
                  ? `${event.registeredCount || 0}/${event.capacity} sinh viên`
                  : (event.registeredCount || 0) > 0
                    ? `${event.registeredCount} sinh viên`
                    : event.quotaText || 'Không giới hạn'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Nút hành động chính toàn chiều ngang */}
        <div className="px-3.5 sm:px-4 pt-1">{mobilePrimaryButton}</div>

        {/* 6. Thống kê và các hành động tương tác */}
        <div className="px-3.5 sm:px-4 pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (event.bannerUrl) {
                  setIsPhotoViewerOpen(true)
                }
              }}
              className="flex h-10 items-center justify-center gap-1.5 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Bình luận"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Bình luận</span>
            </button>
            <ShareEventButton eventId={String(event.id)} title={event.title || 'Sự kiện'} />
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}
            aria-pressed={isSaved}
            className={`flex h-10 items-center gap-1.5 px-2 transition-colors cursor-pointer ${isSaved ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
              }`}
          >
            <Bookmark
              className={`h-4 w-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`}
            />
            <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
          </button>
        </div>

        {/* Modal xem ảnh */}
        {event.bannerUrl && (
          <EventPhotoViewerModal
            isOpen={isPhotoViewerOpen}
            onClose={() => setIsPhotoViewerOpen(false)}
            event={{
              id: event.id,
              eventId: event.id,
              title: event.title,
              description: event.description,
              bannerUrl: event.bannerUrl,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              pointsReward: benefitLines.map((b) => b.title).join(' · '),
              benefitLines,
              status: event.status,
              dateClose: event.dateClose,
              capacity: event.capacity,
              registeredCount: event.registeredCount,
              quotaText: event.quotaText,
              organizerName: organizerDisplayName,
              organizerAvatarUrl: event.organizerAvatarUrl,
              organizerId: event.organizerId,
              timeAgo: event.timeAgo,
              isFollowed,
              isSaved,
              isRegistered,
              registrationStatus,
            }}
            onRegister={(evId) => {
              setIsRegistered(true)
              setRegistrationStatus('REGISTERED')
              onRegister?.(evId)
            }}
            onCancelRegister={(evId) => {
              setIsRegistered(false)
              setRegistrationStatus(undefined)
              onCancelRegister?.(evId)
            }}
            onToggleSave={onToggleSave}
            onToggleFollow={onToggleFollow}
          />
        )}
      </article>
    )
  }

  return (
    <article
      data-event-id={event.id}
      data-recommended={event.isRecommended ? 'true' : undefined}
      className="student-feed-card w-full min-w-0 max-w-[680px] mx-auto rounded-xl bg-white dark:bg-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] dark:border dark:border-border/60 text-left pt-2.5 pb-[12px] px-0 flex flex-col gap-3 relative"
    >
      {/* 1. Header: Organization Info & Follow CTA (Figma: FanpageInfo [680x48], pad: 4px 12px 4px 12px, gap: 12px) */}
      <div className="flex min-h-12 items-start md:items-center justify-between gap-2 px-3 py-1">
        <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
          <Tooltip content={`Xem trang ${organizerDisplayName}`}>
            <Link
              to={fanpageUrl}
              className="shrink-0 rounded-full hover:opacity-85 transition-opacity cursor-pointer"
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
          </Tooltip>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className={isPhone ? 'min-w-0' : 'flex items-center gap-1 min-w-0'}>
              <Tooltip content={organizerDisplayName}>
                <Link
                  to={fanpageUrl}
                  aria-label={organizerDisplayName}
                  className="block font-semibold text-sm leading-5 text-foreground hover:text-primary hover:underline transition-colors md:truncate cursor-pointer"
                >
                  {isPhone ? (
                    <>
                      {namePrefix}
                      <span className="whitespace-nowrap">
                        {nameLastWord}
                        <VerifiedBadge className="ml-1 h-3.5 w-3.5 align-[-2px]" />
                      </span>
                    </>
                  ) : (
                    organizerDisplayName
                  )}
                </Link>
              </Tooltip>
              {!isPhone && <VerifiedBadge className="h-4 w-4 shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium leading-4 text-[#4B5563] dark:text-muted-foreground">
                {event.timeAgo || 'Vừa xong'}
              </span>
              {(event.recommendationExplain || event.isRecommended) && (
                <Tooltip content={event.recommendationExplain || 'Sự kiện gợi ý phù hợp với bạn'}>
                  <span
                    aria-label="Lý do gợi ý sự kiện"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {isPhone ? (
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-muted-foreground"
                aria-label="Tùy chọn bài viết"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
              <Dialog.Content className="fixed inset-x-0 bottom-0 z-[71] flex flex-col gap-2 rounded-t-xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <Dialog.Title className="font-semibold">Tùy chọn bài viết</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      aria-label="Đóng tùy chọn"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Thao tác với bài viết và fanpage tổ chức.
                </Dialog.Description>
                <Button
                  variant="ghost"
                  className="h-auto min-h-12 justify-start gap-3 whitespace-normal text-left"
                  onClick={() => {
                    handleFollowClick()
                    setMenuOpen(false)
                  }}
                >
                  {isFollowed ? (
                    <BellOff className="h-5 w-5 shrink-0" />
                  ) : (
                    <BellRing className="h-5 w-5 shrink-0" />
                  )}
                  {isFollowed ? 'Bỏ theo dõi fanpage' : 'Theo dõi fanpage'}
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 justify-start gap-3"
                  onClick={() => {
                    handleSaveClick()
                    setMenuOpen(false)
                  }}
                >
                  <Bookmark className="h-5 w-5" />
                  {isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}
                </Button>
                <Link
                  to={fanpageUrl}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-semibold hover:bg-muted"
                >
                  <Users className="h-5 w-5" />
                  Xem fanpage
                </Link>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : (
          <button
            type="button"
            onClick={handleFollowClick}
            className={`h-6 shrink-0 whitespace-nowrap inline-flex items-center justify-center rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${isFollowed
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
        )}
      </div>

      {/* 2. Title & Description (Max 2 lines, collapses naturally for 1-line titles without blank gap) */}
      <div className="px-3 py-0 flex flex-col gap-1.5">
        {!event.bannerUrl && eventTypeDisplay && (
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold select-none">
            <Tag className="h-3 w-3" />
            <span>{eventTypeDisplay}</span>
          </div>
        )}
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
              <div className="break-words whitespace-pre-line text-sm leading-[22px]">
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
        <div className="relative w-full min-h-[220px] md:min-h-[380px] max-h-[620px] flex items-center justify-center overflow-hidden bg-slate-900 select-none">
          <PosterBackdrop src={event.bannerUrl} />

          {/* Top-Left Badge: Event Type */}
          {eventTypeDisplay && (
            <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md text-xs font-semibold tracking-wide pointer-events-none select-none">
              <Tag className="h-3 w-3 text-white/90" />
              <span>{eventTypeDisplay}</span>
            </div>
          )}

          {/* Foreground Sharp Poster Image with true proportions - Click to open Photo Viewer Lightbox */}
          <Tooltip content="Nhấn vào hình ảnh để phóng to và xem rõ chi tiết">
            <button
              type="button"
              onClick={() => setIsPhotoViewerOpen(true)}
              className="relative z-1 max-h-[70dvh] md:max-h-[580px] w-auto max-w-full flex items-center justify-center cursor-pointer"
            >
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="max-h-[70dvh] md:max-h-[580px] w-auto max-w-full object-contain rounded-sm shadow-md"
                loading="lazy"
              />
            </button>
          </Tooltip>

          {/* Compact Important Info Badge - Bottom Right over image (transparent frosted glass, 4 uniform rows) */}
          <div className="absolute bottom-2.5 right-2.5 z-10 max-w-[280px] bg-black/70 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-2 text-white shadow-lg hidden md:flex flex-col gap-1.5 text-[11px] leading-tight select-none pointer-events-auto">
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
              <Tooltip content={locationDisplay}>
                <span className="truncate font-medium text-white/85">{locationDisplay}</span>
              </Tooltip>
            </div>

            {/* Benefits */}
            {benefitLines.length > 0 && (
              <div className="flex items-start gap-2 min-w-0">
                <Gift className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2] mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  {benefitLines.map((benefit, i) => (
                    <TextTooltip
                      key={i}
                      className="truncate font-medium text-white/85"
                      label={benefit.label}
                      content={benefit.title}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quota */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-white shrink-0 stroke-[2.2]" />
              <span className="truncate font-medium text-white/85">
                {event.capacity > 0
                  ? `${event.registeredCount || 0}/${event.capacity} sinh viên`
                  : (event.registeredCount || 0) > 0
                    ? `${event.registeredCount} sinh viên`
                    : event.quotaText || 'Không giới hạn'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback metadata only if event has NO poster/banner */}
      {(!event.bannerUrl || isPhone) && (
        <div className="px-3 py-1">
          <div className="border-t border-[#E5E7EB] dark:border-border/60 pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {/* Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-foreground font-medium">
                {formatDisplayDateTime(event.startTime, event.endTime)}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <Tooltip content={locationDisplay}>
                <span className="truncate text-foreground font-medium">{locationDisplay}</span>
              </Tooltip>
            </div>

            {/* Benefits */}
            {benefitLines.length > 0 && (
              <div className="flex items-start gap-2 min-w-0">
                <Gift className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  {benefitLines.map((benefit, i) => (
                    <TextTooltip
                      key={i}
                      className="truncate text-muted-foreground"
                      label={benefit.label}
                      content={benefit.title}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quota */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-[#0070A5] dark:text-blue-400 shrink-0" />
              <span className="truncate text-muted-foreground font-medium">
                {event.capacity > 0
                  ? `${event.registeredCount || 0}/${event.capacity} sinh viên`
                  : (event.registeredCount || 0) > 0
                    ? `${event.registeredCount} sinh viên`
                    : event.quotaText || 'Không giới hạn'}
              </span>
            </div>
          </div>
        </div>
      )}

      {isPhone && (
        <div className="px-3">
          <RegistrationDeadline info={closeInfo} isRegistered={isRegistered} />
        </div>
      )}
      {/* Post actions share one row on phones. */}
      <div className="student-feed-actions px-3 pt-0 pb-0 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Comment & Share (Figma gap: 16px) */}
        <div className="student-feed-social flex items-center gap-4">
          <Tooltip content="Bình luận">
            <button
              type="button"
              onClick={() => {
                if (event.bannerUrl) {
                  setIsPhotoViewerOpen(true)
                }
              }}
              className="flex h-11 items-center justify-center gap-2 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer md:w-11 md:px-0"
              aria-label="Bình luận"
            >
              <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs font-medium md:hidden">Bình luận</span>
            </button>
          </Tooltip>
          <ShareEventButton eventId={String(event.id)} title={event.title || 'Sự kiện'} />
        </div>

        {/* Right: Close Info + Bookmark + Register CTA */}
        <div className="student-feed-register flex min-w-0 flex-wrap items-center justify-end gap-2 md:flex-nowrap">
          {/* Registration close info to the left of bookmark */}
          {!isPhone && <RegistrationDeadline info={closeInfo} isRegistered={isRegistered} />}
          <Tooltip content={isSaved ? 'Đã lưu (nhấn để bỏ lưu)' : 'Lưu sự kiện'}>
            <button
              type="button"
              onClick={handleSaveClick}
              aria-label={isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}
              aria-pressed={isSaved}
              className={`hidden md:flex h-11 w-11 items-center justify-center transition-colors cursor-pointer ${isSaved
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-[#6B7280] hover:text-amber-500'
                }`}
            >
              <Bookmark
                className={`h-6 w-6 transition-all ${isSaved ? 'fill-amber-500 text-amber-500 drop-shadow-xs' : ''
                  }`}
              />
            </button>
          </Tooltip>
          {registrationAction}{' '}
        </div>
      </div>

      {/* Lightbox xem ảnh to rõ chuẩn Facebook với thông tin quan trọng đặt dưới phần bình luận */}
      {event.bannerUrl && (
        <EventPhotoViewerModal
          isOpen={isPhotoViewerOpen}
          onClose={() => setIsPhotoViewerOpen(false)}
          event={{
            id: event.id,
            eventId: event.id,
            title: event.title,
            description: event.description,
            bannerUrl: event.bannerUrl,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            pointsReward: benefitLines.map((benefit) => benefit.title).join(' · '),
            benefitLines,
            status: event.status,
            dateClose: event.dateClose,
            capacity: event.capacity,
            registeredCount: event.registeredCount,
            quotaText: event.quotaText,
            organizerName: organizerDisplayName,
            organizerAvatarUrl: event.organizerAvatarUrl,
            organizerId: event.organizerId,
            timeAgo: event.timeAgo,
            isFollowed,
            isSaved,
            isRegistered,
            registrationStatus,
          }}
          onRegister={(evId) => {
            setIsRegistered(true)
            setRegistrationStatus('REGISTERED')
            onRegister?.(evId)
          }}
          onCancelRegister={(evId) => {
            setIsRegistered(false)
            setRegistrationStatus(undefined)
            onCancelRegister?.(evId)
          }}
          onToggleSave={onToggleSave}
          onToggleFollow={onToggleFollow}
        />
      )}
    </article>
  )
}
