import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function useRegistrationDeadline(dateClose?: string, status?: string) {
  const [now, setNow] = useState(Date.now)
  const parsed = dateClose ? new Date(dateClose).getTime() : NaN
  const closeMs = Number.isFinite(parsed) ? parsed : null
  const closedByStatus = [
    'CLOSED',
    'CLOSED_REGISTRATION',
    'COMPLETED',
    'FINISHED',
    'CANCELLED',
    'ONGOING',
    'IN_PROGRESS',
  ].includes(status || '')

  useEffect(() => {
    if (closeMs === null || closedByStatus) return
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      const current = Date.now()
      setNow(current)
      if (current < closeMs) {
        timer = setTimeout(update, Math.min(60_000, closeMs - current))
      }
    }
    update()
    return () => clearTimeout(timer)
  }, [closeMs, closedByStatus])

  const remaining = closeMs === null ? null : closeMs - now
  const isClosed = closedByStatus || (remaining !== null && remaining <= 0)
  const isUrgent = !isClosed && remaining !== null && remaining < 24 * 60 * 60 * 1000
  const countdown =
    remaining === null
      ? ''
      : remaining >= 60 * 60 * 1000
        ? `Còn ${Math.ceil(remaining / (60 * 60 * 1000))} giờ`
        : `Còn ${Math.max(1, Math.ceil(remaining / 60_000))} phút`
  const closeDate = closeMs === null ? null : new Date(closeMs)
  const pad = (value: number) => String(value).padStart(2, '0')
  const timeText = closeDate
    ? `${pad(closeDate.getHours())}:${pad(closeDate.getMinutes())} · ${pad(closeDate.getDate())}/${pad(closeDate.getMonth() + 1)}${closeDate.getFullYear() !== new Date(now).getFullYear() ? `/${closeDate.getFullYear()}` : ''}`
    : ''
  const fullText = closeDate
    ? closeDate.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : ''

  const dateText = timeText.split(' · ')[1] || ''
  return { isClosed, isUrgent, countdown, timeText, dateText, fullText }
}

export function RegistrationDeadline({
  info,
  isRegistered = false,
  isAdmin = false,
}: {
  info: ReturnType<typeof useRegistrationDeadline>
  isRegistered?: boolean
  isAdmin?: boolean
}) {
  if (!info.timeText && !info.isClosed) return null
  const highlight = info.isUrgent && !isRegistered
  const label = info.isClosed
    ? `Đã đóng${isAdmin && info.dateText ? ` · ${info.dateText}` : ''}`
    : highlight
      ? info.countdown
      : `Hạn ${info.timeText}`
  const details = [
    info.isClosed ? 'Đã đóng đăng ký' : isRegistered ? 'Đã đăng ký' : 'Đang mở đăng ký',
    info.fullText ? `Hạn đăng ký: ${info.fullText}` : '',
    info.isUrgent ? info.countdown : '',
  ]
    .filter(Boolean)
    .join('\n')
  return (
    <Tooltip content={details}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground',
          highlight && 'text-amber-700 dark:text-amber-400'
        )}
        aria-label={details}
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  )
}
