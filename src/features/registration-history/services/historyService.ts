import { apiClient } from '@/shared'
import type { RegisteredEventItem, AttendanceSession, EventStatus } from '../types/history.types'

export const CTU_CRITERIA_CODE_MAP: Record<number, string> = {
  10: 'mục I.a',
  11: 'mục I.b',
  12: 'mục I.c',
  20: 'mục II.a',
  21: 'mục II.b',
  30: 'mục III.a',
  31: 'mục III.b',
  32: 'mục III.c',
  40: 'mục IV.a',
  41: 'mục IV.b',
  50: 'mục V.a',
  51: 'mục V.b',
  52: 'mục V.c',
  511: 'mục V.b',
  512: 'mục V.b',
  501: 'mục V.a',
  502: 'mục V.a',
  521: 'mục V.c',
  522: 'mục V.c',
  301: 'mục III.a',
  302: 'mục III.a',
  311: 'mục III.b',
  312: 'mục III.b',
  321: 'mục III.c',
  401: 'mục IV.a',
  402: 'mục IV.a',
  411: 'mục IV.b',
  412: 'mục IV.b',
  201: 'mục II.a',
  202: 'mục II.a',
  211: 'mục II.b',
  101: 'mục I.a',
  102: 'mục I.a',
  103: 'mục I.a',
  104: 'mục I.a',
  111: 'mục I.b',
  112: 'mục I.b',
  121: 'mục I.c',
  122: 'mục I.c',
}

export function formatCtuCategoryCode(catId?: number | null): string {
  if (!catId) return ''
  if (CTU_CRITERIA_CODE_MAP[catId]) return CTU_CRITERIA_CODE_MAP[catId]
  const idStr = String(catId)
  if (idStr.startsWith('51')) return 'mục V.b'
  if (idStr.startsWith('50')) return 'mục V.a'
  if (idStr.startsWith('52')) return 'mục V.c'
  if (idStr.startsWith('30')) return 'mục III.a'
  if (idStr.startsWith('31')) return 'mục III.b'
  if (idStr.startsWith('32')) return 'mục III.c'
  if (idStr.startsWith('40')) return 'mục IV.a'
  if (idStr.startsWith('41')) return 'mục IV.b'
  if (idStr.startsWith('20')) return 'mục II.a'
  if (idStr.startsWith('21')) return 'mục II.b'
  if (idStr.startsWith('10')) return 'mục I.a'
  if (idStr.startsWith('11')) return 'mục I.b'
  if (idStr.startsWith('12')) return 'mục I.c'
  return `mục ${catId}`
}

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
  const info = raw.eventInfo || {}
  const eventId = raw.eventId || info.id || raw.id || '0'
  const id = String(raw.id || eventId)
  const title = info.name || raw.eventName || raw.title || 'Sự kiện chưa đặt tên'
  const eventName = title

  // Organizer mapping: Prioritize fanpageName from eventInfo
  const organizerName =
    info.fanpageName ||
    raw.organizerName ||
    raw.fanpageName ||
    (raw.organizer && raw.organizer.name) ||
    'Đoàn Trường CNTT & TT'

  const defaultAvatar = organizerName.includes('CNTT')
    ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
    : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'

  const organizerAvatar =
    info.fanpageAvatarUrl ||
    raw.organizerAvatar ||
    raw.fanpageAvatar ||
    (raw.organizer && raw.organizer.avatarUrl) ||
    defaultAvatar

  const organizer = {
    name: organizerName,
    avatarUrl: organizerAvatar,
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

  const rawDate =
    info.dateHappen ||
    raw.dateHappen ||
    info.startDate ||
    raw.startDate ||
    info.dateOpen ||
    raw.dateOpen ||
    raw.regDate

  const dateHappen =
    (info.dateHappen || raw.dateHappen) && !(info.dateHappen || raw.dateHappen).includes('T')
      ? info.dateHappen || raw.dateHappen
      : formatHappenDate(rawDate)

  const timeHappen =
    (info.dateHappen || raw.dateHappen) && !(info.dateHappen || raw.dateHappen).includes('T')
      ? info.dateHappen || raw.dateHappen
      : formatHappenTime(rawDate)

  // Format detailed benefits: e.g. "+3 ĐRL mục V.b", "Tiêu chuẩn SV5T: ..."
  const formattedBenefits: string[] = []
  if (Array.isArray(info.eventPoints) && info.eventPoints.length > 0) {
    info.eventPoints.forEach((ep: any) => {
      const pts = ep.point ?? 0
      const code = formatCtuCategoryCode(ep.pointCategoryId)
      if (pts > 0) {
        formattedBenefits.push(`+${pts} ĐRL ${code}`.trim())
      }
    })
  }

  if (info.criteriaName) {
    formattedBenefits.push(`Tiêu chuẩn SV5T: ${info.criteriaName}`)
  }

  const totalEventPoints = Array.isArray(info.eventPoints)
    ? info.eventPoints.reduce((sum: number, p: any) => sum + (p.point || 0), 0)
    : 0

  const benefits: string[] =
    formattedBenefits.length > 0
      ? formattedBenefits
      : Array.isArray(raw.benefits) && raw.benefits.length > 0
        ? raw.benefits
        : totalEventPoints > 0
          ? [`+${totalEventPoints} ĐRL`]
          : ['ĐRL theo quy định']

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
    dateOpen: info.dateOpen || raw.dateOpen,
    dateClose: info.dateClose || raw.dateClose,
    regDate: raw.regDate,
    location: info.location || raw.location || 'Đang cập nhật',
    status,
    pointsCategory:
      formattedBenefits[0] ||
      (totalEventPoints > 0 ? `ĐRL: +${totalEventPoints}` : 'ĐRL theo quy định'),
    criteriaSv5t: info.criteriaName || raw.criteriaSv5t || '',
    benefits,
    extraBenefitsCount:
      typeof raw.extraBenefitsCount === 'number'
        ? raw.extraBenefitsCount
        : Math.max(0, benefits.length - 2),
    capacity: Number(info.capacity ?? raw.capacity ?? 0),
    registeredCount: Number(raw.registeredCount || 0),
    bannerUrl: info.bannerUrl || raw.bannerUrl || '',
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
   * Cancel event registration
   */
  async cancelRegistration(
    eventId: string | number,
    reason = 'Hủy đăng ký từ giao diện'
  ): Promise<void> {
    await apiClient.patch(`/registrations/me/events/${eventId}/cancel`, {
      reason,
    })
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
