import { apiClient } from '@/shared'
import type { RegisteredEventItem, AttendanceSession, EventStatus } from '../types/history.types'

/**
 * Normalizes backend date strings to human-friendly display
 */
export function formatHappenDate(rawDate?: string): string {
  if (!rawDate) return 'Đang cập nhật'
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return rawDate

    const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()]
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    return `${dayOfWeek}, ${day}/${month}/${year}`
  } catch {
    return rawDate
  }
}

export function formatHappenTime(rawDate?: string): string {
  if (!rawDate) return ''
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return ''

    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    return `${hours}h${mins}, ${day}/${month}/${year}`
  } catch {
    return ''
  }
}

/**
 * Maps raw backend registration entity to UI model RegisteredEventItem
 */
export function normalizeRegisteredEvent(raw: any): RegisteredEventItem {
  const eventId = raw.eventId || raw.id || '0'
  const id = String(raw.id || eventId)
  const title = raw.eventName || raw.title || 'Sự kiện chưa đặt tên'
  const eventName = title

  const organizer = raw.organizer || {
    name: raw.organizerName || raw.fanpageName || 'Đoàn trường ĐHCT',
    avatarUrl: raw.organizerAvatar || raw.fanpageAvatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    isVerified: true,
  }

  // Map status
  let status: EventStatus = 'UPCOMING'
  const rawStatus = String(raw.status || '').toUpperCase()
  if (rawStatus === 'COMPLETED') {
    status = 'COMPLETED'
  } else if (rawStatus === 'ABSENT' || rawStatus === 'REJECTED') {
    status = 'ABSENT'
  } else if (rawStatus === 'CANCELLED') {
    status = 'CANCELLED'
  } else if (
    rawStatus === 'UPCOMING' ||
    rawStatus === 'REGISTERED' ||
    rawStatus === 'CHECKED_IN' ||
    rawStatus === 'APPROVED'
  ) {
    status = 'UPCOMING'
  }

  const rawDate = raw.dateHappen || raw.startDate || raw.dateOpen || raw.regDate
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
    location: raw.location || 'Đang cập nhật',
    status,
    pointsCategory:
      raw.pointsCategory || (benefits.length > 0 ? `ĐRL: +${benefits[0]}` : 'ĐRL theo quy định'),
    criteriaSv5t: raw.criteriaSv5t || '',
    benefits,
    extraBenefitsCount:
      typeof raw.extraBenefitsCount === 'number'
        ? raw.extraBenefitsCount
        : Math.max(0, benefits.length - 2),
    capacity: Number(raw.capacity || 0),
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
    attendanceMethod: raw.attendanceMethod || 'MANUAL',
    attendanceSessionType: raw.attendanceSessionType || 'BOTH',
    checkInAt: raw.checkInAt || null,
    checkOutAt: raw.checkOutAt || null,
    checkInEvidenceUrl: raw.checkInEvidenceUrl || null,
    checkOutEvidenceUrl: raw.checkOutEvidenceUrl || null,
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
      const res: any = await apiClient.get('/registrations/me/history', {
        params: { page: 0, size: 100 },
      })
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

  /**
   * Submit student attendance (check-in or check-out) with proof photo
   */
  async submitAttendance(
    eventId: string | number,
    sessionType: 'check-in' | 'check-out',
    proofUrl?: string
  ): Promise<void> {
    await apiClient.patch(`/registrations/me/events/${eventId}/${sessionType}`, {
      ...(proofUrl ? { proofUrl } : {}),
    })
  },
}
