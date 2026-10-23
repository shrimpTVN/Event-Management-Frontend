export type HistoryStatus = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'ABSENT' | 'CANCELLED'

export type EventStatus =
  | 'UPCOMING'
  | 'COMPLETED'
  | 'ABSENT'
  | 'CANCELLED'
  | 'REGISTERED'
  | 'CHECKED_IN'
  | 'REJECTED'
  | string

export interface AttendanceSession {
  id: string
  sessionName: string // e.g. "Buổi sáng (07:30 - 11:30)", "Buổi chiều (13:30 - 17:00)"
  checkInTime?: string
  checkedBy?: string
  status: 'VALID' | 'ABSENT' | 'NOT_STARTED' | string
}

export interface RegisteredEventItem {
  id: string
  eventId: string | number
  title?: string
  eventName?: string
  organizer?: {
    name?: string
    avatarUrl?: string
    isVerified?: boolean
  }
  timeHappen?: string // e.g. "18h30, 16/09/2026"
  dateHappen?: string // e.g. "Thứ 2, 14/09/2026"
  dateOpen?: string
  dateClose?: string
  regDate?: string
  location?: string
  status: EventStatus
  pointsCategory?: string // e.g. "ĐRL: +3đ Mục V.b"
  criteriaSv5t?: string // e.g. "Tiêu chí SV5T cấp Khoa"
  benefits?: string[] // e.g. ['5đ Mục II.b', '3đ Mục V.b', 'Thể lực tốt']
  extraBenefitsCount?: number // e.g. 2 for "+2"
  capacity?: number
  registeredCount?: number
  bannerUrl?: string
  registrationDate?: string
  attendanceSessions?: AttendanceSession[]
  canCancel?: boolean
  canRequestAbsence?: boolean
  hasProof?: boolean
  evidenceUrl?: string | null
  reason?: string | null
  studentInfo?: {
    mssv: string
    fullName: string
  }
}

export interface TrendIndicator {
  value: string
  isUp?: boolean
  subText: string
}

export interface HistoryStats {
  totalRegistered: number
  totalTrend?: TrendIndicator
  upcoming: number
  upcomingTrend?: TrendIndicator
  completed: number
  completedTrend?: TrendIndicator
  absent: number
  absentTrend?: TrendIndicator
}

export interface AbsenceFormData {
  eventId: string
  sessionId: string
  reason: string
  proofFile?: File | null
  proofPreviewUrl?: string
}

/**
 * Normalizes backend / mock statuses to the standard UI HistoryStatus:
 * - 'REGISTERED' | 'CHECKED_IN' | 'UPCOMING' -> 'UPCOMING'
 * - 'COMPLETED' -> 'COMPLETED'
 * - 'REJECTED' | 'ABSENT' -> 'ABSENT'
 * - 'CANCELLED' -> 'CANCELLED'
 */
export function normalizeHistoryStatus(
  status?: string
): 'UPCOMING' | 'COMPLETED' | 'ABSENT' | 'CANCELLED' {
  if (!status) return 'UPCOMING'
  const upper = status.trim().toUpperCase()
  if (upper === 'COMPLETED') return 'COMPLETED'
  if (upper === 'CANCELLED') return 'CANCELLED'
  if (upper === 'ABSENT' || upper === 'REJECTED') return 'ABSENT'
  if (upper === 'UPCOMING' || upper === 'REGISTERED' || upper === 'CHECKED_IN') return 'UPCOMING'
  return 'UPCOMING'
}

