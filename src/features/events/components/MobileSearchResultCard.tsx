import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, ImageIcon, MapPin } from 'lucide-react'
import type { Event } from '../types/event.types'
import { useRegistrationDeadline } from './RegistrationDeadline'

const categories: Record<string, string> = {
  WORKSHOP: 'Workshop',
  CONFERENCE: 'Hội nghị',
  SEMINAR: 'Hội thảo',
  NETWORKING: 'Giao lưu',
  HACKATHON: 'Hackathon',
  VOLUNTEER: 'Tình nguyện',
  SPORTS: 'Thể thao',
  ACADEMIC: 'Học thuật',
  OTHER: 'Khác',
}

export function MobileSearchResultCard({ event }: { event: Event }) {
  const route = useLocation()
  const [imageFailed, setImageFailed] = useState(false)
  const deadline = useRegistrationDeadline(event.dateClose, event.status)
  const status =
    event.status === 'CANCELLED'
      ? 'Đã hủy'
      : ['COMPLETED', 'FINISHED'].includes(event.status)
        ? 'Đã kết thúc'
        : ['ONGOING', 'IN_PROGRESS'].includes(event.status)
          ? 'Đang diễn ra'
          : event.registrationStatus === 'PENDING'
            ? 'Chờ duyệt'
            : event.registrationStatus === 'REJECTED'
              ? 'Bị từ chối'
              : event.isRegistered
                ? 'Đã đăng ký'
                : deadline.isClosed
                  ? 'Đã đóng đăng ký'
                  : event.capacity > 0 && (event.registeredCount || 0) >= event.capacity
                    ? 'Đã đủ chỗ'
                    : ''
  const date = event.startTime ? new Date(event.startTime) : null
  const dateLabel =
    date && Number.isFinite(date.getTime())
      ? date.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : 'Chưa cập nhật thời gian'
  const place =
    typeof event.location === 'string'
      ? event.location
      : event.location?.address ||
        (event.location?.type === 'ONLINE' ? 'Trực tuyến' : 'Chưa cập nhật địa điểm')
  const type = event.eventTypeName || categories[event.category]
  return (
    <article className="min-w-0 rounded-xl border border-border bg-background">
      <Link
        to={`/events/${event.id}`}
        state={{ from: `${route.pathname}${route.search}` }}
        className="flex min-w-0 items-start gap-3 rounded-xl p-3 text-foreground transition-colors active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {event.bannerUrl && !imageFailed ? (
            <img
              src={event.bannerUrl}
              onError={() => setImageFailed(true)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="line-clamp-2 break-words font-k2d text-sm font-semibold leading-5">
            {event.title}
          </h2>
          <p className="truncate text-xs leading-5 text-muted-foreground">
            {event.organizerFullName || event.organizerName || event.fanpageName || 'Ban tổ chức'}
          </p>
          <p className="flex min-w-0 items-center gap-1.5 text-xs leading-5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{dateLabel}</span>
          </p>
          <p className="flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{place}</span>
          </p>
          {(type || status) && (
            <div className="flex min-w-0 flex-wrap gap-1.5 pt-1 text-[11px] leading-4">
              {type && (
                <span className="max-w-full break-words rounded-md bg-brand-subtle px-2 py-1 text-brand-subtle-foreground">
                  {type}
                </span>
              )}
              {status && (
                <span
                  className={`rounded-md px-2 py-1 ${['Đã hủy', 'Bị từ chối'].includes(status) ? 'bg-destructive/10 text-destructive' : status === 'Đã đăng ký' ? 'bg-green-600/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                >
                  {status}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
