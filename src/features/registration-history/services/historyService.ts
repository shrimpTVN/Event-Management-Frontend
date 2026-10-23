import { apiClient } from '@/shared'
import {
  type RegisteredEventItem,
  type AttendanceSession,
  normalizeHistoryStatus,
} from '../types/history.types'

/**
 * Format raw ISO string to Vietnamese human-readable weekday and date:
 * e.g. "Thứ 2, 14/09/2026"
 */
function formatHappenDate(dateStr?: string): string {
  if (!dateStr) return 'Đang cập nhật'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${weekdays[d.getDay()]}, ${day}/${month}/${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

/**
 * Format raw ISO string to Vietnamese human-readable time:
 * e.g. "18h30, 16/09/2026"
 */
function formatHappenTime(dateStr?: string): string {
  if (!dateStr) return 'Đang cập nhật'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${hours}h${mins}, ${day}/${month}/${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

/**
 * Normalizes backend / mock registration history item to RegisteredEventItem
 * with defensive fallbacks for missing properties.
 */
export function normalizeRegisteredEvent(raw: any): RegisteredEventItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `reg-${Math.random()}`,
      eventId: '',
      title: 'Sự kiện',
      eventName: 'Sự kiện',
      organizer: { name: 'Ban Tổ Chức', avatarUrl: '', isVerified: false },
      status: 'UPCOMING',
      attendanceSessions: [],
      benefits: [],
      timeHappen: 'Đang cập nhật',
      dateHappen: 'Đang cập nhật',
      location: 'Hội trường Rùa',
      capacity: 100,
      registeredCount: 0,
      pointsCategory: 'ĐRL theo quy định',
      canCancel: true,
      canRequestAbsence: true,
      hasProof: false,
    }
  }

  const eventId = String(raw.eventId ?? raw.id ?? '')
  const id = String(raw.id ?? (eventId ? `reg-${eventId}` : `reg-${Math.random()}`))
  const title = raw.title || raw.eventName || 'Sự kiện'
  const eventName = raw.eventName || title
  const status = normalizeHistoryStatus(raw.status)

  const organizer = {
    name: raw.organizer?.name || 'Ban Tổ Chức',
    avatarUrl: raw.organizer?.avatarUrl || '',
    isVerified: Boolean(raw.organizer?.isVerified),
  }

  // Format date/time if not already pre-formatted
  const rawDate = raw.dateHappen || raw.dateOpen || raw.regDate
  const dateHappen = raw.dateHappen && !raw.dateHappen.includes('T')
    ? raw.dateHappen
    : formatHappenDate(rawDate)

  const timeHappen = raw.timeHappen && !raw.timeHappen.includes('T')
    ? raw.timeHappen
    : formatHappenTime(rawDate)

  const benefits: string[] = Array.isArray(raw.benefits) ? raw.benefits : []
  const attendanceSessions: AttendanceSession[] = Array.isArray(raw.attendanceSessions)
    ? raw.attendanceSessions
    : raw.checkInAt
      ? [
          {
            id: `session-${eventId}-1`,
            sessionName: 'Buổi chính',
            checkInTime: raw.checkInAt,
            checkedBy: 'Hệ thống tự động',
            status: 'VALID',
          },
        ]
      : []

  return {
    id,
    eventId,
    title,
    eventName,
    organizer,
    timeHappen: timeHappen || 'Đang cập nhật',
    dateHappen: dateHappen || 'Đang cập nhật',
    dateOpen: raw.dateOpen,
    dateClose: raw.dateClose,
    regDate: raw.regDate,
    location: raw.location || 'Hội trường Rùa',
    status,
    pointsCategory:
      raw.pointsCategory || (benefits.length > 0 ? `ĐRL: +${benefits[0]}` : 'ĐRL theo quy định'),
    criteriaSv5t: raw.criteriaSv5t || '',
    benefits,
    extraBenefitsCount:
      typeof raw.extraBenefitsCount === 'number'
        ? raw.extraBenefitsCount
        : Math.max(0, benefits.length - 2),
    capacity: Number(raw.capacity || 100),
    registeredCount: Number(raw.registeredCount || 0),
    bannerUrl: raw.bannerUrl || '',
    registrationDate: raw.registrationDate || raw.regDate || '',
    attendanceSessions,
    canCancel: typeof raw.canCancel === 'boolean' ? raw.canCancel : status === 'UPCOMING',
    canRequestAbsence:
      typeof raw.canRequestAbsence === 'boolean' ? raw.canRequestAbsence : status === 'UPCOMING',
    hasProof:
      typeof raw.hasProof === 'boolean'
        ? raw.hasProof
        : Boolean(raw.evidenceUrl || raw.checkInEvidenceUrl || raw.checkInAt),
    evidenceUrl: raw.evidenceUrl || raw.checkInEvidenceUrl || null,
    reason: raw.reason || null,
    studentInfo: raw.studentInfo || (raw.studentId || raw.studentName ? {
      mssv: raw.studentId || '',
      fullName: raw.studentName || raw.fullName || '',
    } : undefined),
  }
}

export const historyService = {
  /**
   * Fetches registration history of current student
   */
  async getMyHistory(): Promise<RegisteredEventItem[]> {
    try {
      const res: any = await apiClient.get('/registrations/me/history')
      let rawList: any[] = []
      if (Array.isArray(res)) {
        rawList = res
      } else if (res && Array.isArray(res.content)) {
        rawList = res.content
      } else if (res && Array.isArray(res.items)) {
        rawList = res.items
      } else if (res && res.data && Array.isArray(res.data.content)) {
        rawList = res.data.content
      } else if (res && Array.isArray(res.data)) {
        rawList = res.data
      }
      return rawList.map(normalizeRegisteredEvent)
    } catch (err) {
      console.error('Failed to fetch registration history:', err)
      return []
    }
  },
}
