import type { AdminEvent } from '../types/fanpageAdmin.types'

export type AdminEventTab = 'OPEN_REGISTRATION' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'DRAFT'

const timestamp = (value?: string | null) => {
  const result = value ? Date.parse(value) : NaN
  return Number.isFinite(result) ? result : null
}

export function adminEventTiming(event: AdminEvent) {
  const start =
    event.startsAt !== undefined
      ? timestamp(event.startsAt)
      : timestamp(
          event.dateHappen?.includes('T')
            ? event.dateHappen
            : event.dateStart
              ? `${event.dateStart.slice(0, 10)}T${event.timeStart || '00:00'}`
              : undefined
        )
  const candidateEnd =
    event.endsAt !== undefined
      ? timestamp(event.endsAt)
      : timestamp(
          event.dateEnd ? `${event.dateEnd.slice(0, 10)}T${event.timeEnd || '00:00'}` : undefined
        )
  return {
    start,
    // Never invent a duration, or interpret the duplicated start timestamp as an end.
    end: candidateEnd !== null && (start === null || candidateEnd > start) ? candidateEnd : null,
    open: timestamp(event.dateOpen),
    close: timestamp(event.dateClose),
  }
}

export function adminRegistrationLabel(
  event: AdminEvent,
  registeredCount = event.registeredCount,
  now = Date.now()
) {
  const { open, close } = adminEventTiming(event)
  if (event.status === 'DRAFT') return 'Chưa mở đăng ký'
  if (event.status !== 'PUBLISHED' || (close !== null && now > close)) return 'Đã đóng đăng ký'
  if (open !== null && now < open) return 'Chưa mở đăng ký'
  if (event.capacity > 0 && registeredCount >= event.capacity) return 'Đã đủ chỗ'
  return 'Đang mở đăng ký'
}

export function adminEventState(
  event: AdminEvent,
  registeredCount = event.registeredCount,
  now = Date.now()
): {
  tab: AdminEventTab | null
  label: string
  detail?: string
  color: string
} {
  const { start, end } = adminEventTiming(event)
  if (event.status === 'DRAFT')
    return { tab: 'DRAFT', label: 'Bản nháp', color: 'bg-muted-foreground/40' }
  if (event.status === 'CANCELLED')
    return { tab: 'CANCELLED', label: 'Đã hủy', color: 'bg-destructive' }
  if (event.status === 'CLOSED' || event.status === 'COMPLETED' || (end !== null && now >= end))
    return { tab: 'COMPLETED', label: 'Đã kết thúc', color: 'bg-muted-foreground/60' }
  if (start !== null && now >= start)
    return { tab: 'ONGOING', label: 'Đang diễn ra', color: 'bg-blue-500' }

  const registration = adminRegistrationLabel(event, registeredCount, now)
  if (registration === 'Đang mở đăng ký')
    return { tab: 'OPEN_REGISTRATION', label: registration, color: 'bg-emerald-500' }
  return {
    tab: null,
    label: start !== null ? 'Chờ diễn ra' : 'Chưa có thời gian',
    detail: registration,
    color: 'bg-amber-500',
  }
}
