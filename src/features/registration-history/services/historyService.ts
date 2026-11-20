import { apiClient } from '@/shared'
import { normalizeAttendanceConfig } from '@/shared/utils/attendanceConfig'
import { createSv5tLabelFormatter } from '@/shared/utils/sv5tLabels'
import type { RegisteredEventItem, AttendanceSession, EventStatus } from '../types/history.types'

interface HistoryPointCategory {
  id: number
  name: string
  children?: HistoryPointCategory[]
}

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

function getOrganizerAvatar(raw: any): string | undefined {
  const info = raw.eventInfo || {}
  return (
    info.fanpageAvatarUrl ||
    info.fanpage?.avatarUrl ||
    raw.organizerAvatar ||
    raw.fanpageAvatarUrl ||
    raw.fanpageAvatar ||
    raw.fanpage?.avatarUrl ||
    raw.organizer?.avatarUrl ||
    undefined
  )
}

function getFanpageId(raw: any): string {
  const id =
    raw.eventInfo?.fanpageId ?? raw.eventInfo?.fanpage?.id ?? raw.fanpageId ?? raw.fanpage?.id
  return id != null && /^[1-9]\d*$/.test(String(id)) ? String(id) : ''
}

/**
 * Maps raw backend registration entity to UI model RegisteredEventItem
 */
export function normalizeRegisteredEvent(
  raw: any,
  formatCriteria: (name: string, criteriaId?: number | string) => string = (name) => name,
  formatCriteriaDetail: (name: string, criteriaId?: number | string) => string = (name) => name,
  pointCategories: HistoryPointCategory[] = []
): RegisteredEventItem {
  const info = raw.eventInfo || {}
  const criteriaName = formatCriteria(
    info.criteriaName || raw.criteriaSv5t || '',
    info.criteriaId ?? raw.criteriaId
  )
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
    'Ban tổ chức'

  const organizerAvatar = getOrganizerAvatar(raw)

  const organizer = {
    name: organizerName,
    avatarUrl: organizerAvatar,
    isVerified: true,
  }

  // Map status
  let status: EventStatus = 'UPCOMING'
  const rawStatus = String(raw.status || '').toUpperCase()
  if (rawStatus === 'COMPLETED' || rawStatus === 'CONFIRMED' || rawStatus === 'RECORDED') {
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
  const benefitDetails: string[] = []
  const categoryNames = new Map<number, string>()
  const collectCategoryNames = (categories: HistoryPointCategory[]) => {
    categories.forEach((category) => {
      categoryNames.set(Number(category.id), category.name)
      if (Array.isArray(category.children)) collectCategoryNames(category.children)
    })
  }
  collectCategoryNames(pointCategories)
  if (Array.isArray(info.eventPoints) && info.eventPoints.length > 0) {
    info.eventPoints.forEach((ep: any) => {
      const pts = ep.point ?? 0
      const code = formatCtuCategoryCode(ep.pointCategoryId)
      if (pts > 0) {
        const label = `+${pts} ĐRL ${code}`.trim()
        formattedBenefits.push(label)
        const name = categoryNames.get(Number(ep.pointCategoryId)) || ep.pointCategoryName
        benefitDetails.push(name ? `${label} (${name})` : label)
      }
    })
  }

  if (info.criteriaName) {
    formattedBenefits.push(`Tiêu chuẩn SV5T: ${criteriaName}`)
  }

  const totalEventPoints = Array.isArray(info.eventPoints)
    ? info.eventPoints.reduce((sum: number, p: any) => sum + (p.point || 0), 0)
    : 0

  const benefits: string[] =
    formattedBenefits.length > 0
      ? formattedBenefits
      : Array.isArray(raw.benefits) && raw.benefits.length > 0
        ? raw.benefits.map((benefit: string) => {
            const prefix = /^(?:Tiêu chuẩn|Tiêu chí)?\s*(?:SV\s*5\s*T|sinh viên 5 tốt)\s*:\s*/i
            return prefix.test(benefit)
              ? `Tiêu chuẩn SV5T: ${formatCriteria(benefit.replace(prefix, ''))}`
              : benefit
          })
        : totalEventPoints > 0
          ? [`+${totalEventPoints} ĐRL`]
          : ['ĐRL theo quy định']

  const attendanceSessions: AttendanceSession[] = Array.isArray(raw.attendanceSessions)
    ? raw.attendanceSessions
    : []

  return {
    id,
    userId: raw.userId,
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
    status: rawStatus || status,
    pointsCategory:
      formattedBenefits[0] ||
      (totalEventPoints > 0 ? `ĐRL: +${totalEventPoints}` : 'ĐRL theo quy định'),
    criteriaSv5t: criteriaName,
    criteriaSv5tDetail: formatCriteriaDetail(
      info.criteriaName || raw.criteriaSv5tDetail || raw.criteriaSv5t || '',
      info.criteriaId ?? raw.criteriaId
    ),
    benefits,
    benefitDetails,
    extraBenefitsCount:
      typeof raw.extraBenefitsCount === 'number'
        ? raw.extraBenefitsCount
        : Math.max(0, benefits.length - 2),
    capacity: Number(info.capacity ?? raw.capacity ?? 0),
    registeredCount: Number(raw.registeredCount || 0),
    bannerUrl: info.bannerUrl || raw.bannerUrl || '',
    registrationDate: raw.registrationDate || raw.regDate || '',
    attendanceSessions,
    canCancel:
      ['REGISTERED', 'UPCOMING', 'APPROVED'].includes(rawStatus) &&
      (typeof raw.canCancel === 'boolean' ? raw.canCancel : true),
    canRequestAbsence:
      typeof raw.canRequestAbsence === 'boolean' ? raw.canRequestAbsence : status === 'UPCOMING',
    hasProof:
      typeof raw.hasProof === 'boolean'
        ? raw.hasProof
        : Boolean(raw.evidenceUrl || raw.checkInEvidenceUrl || raw.checkInAt),
    evidenceUrl: raw.evidenceUrl || raw.checkInEvidenceUrl || null,
    reason: raw.reason || null,
    ...normalizeAttendanceConfig({
      allowSelfCheck: info.allowSelfCheck ?? raw.allowSelfCheck,
      attendanceMethod: info.attendanceMethod ?? raw.attendanceMethod,
      attendanceSessionType: info.attendanceSessionType ?? raw.attendanceSessionType,
    }),
    checkInAt: raw.checkInAt || null,
    checkOutAt: raw.checkOutAt || null,
    checkInBy: raw.checkInBy ?? null,
    checkOutBy: raw.checkOutBy ?? null,
    checkInByName: raw.checkInByName || null,
    checkOutByName: raw.checkOutByName || null,
    checkInEvidenceUrl: raw.checkInEvidenceUrl || null,
    checkOutEvidenceUrl: raw.checkOutEvidenceUrl || null,
    studentInfo:
      raw.studentInfo ||
      (raw.studentId || raw.studentName
        ? {
            mssv: raw.studentId || '',
            fullName: raw.studentName || raw.fullName || '',
          }
        : undefined),
  }
}

export const historyService = {
  /**
   * Fetches registration history of current student
   */
  async getMyHistory(): Promise<RegisteredEventItem[]> {
    try {
      const [res, criterias, pointCategories]: any[] = await Promise.all([
        apiClient.get('/registrations/me/history', { params: { page: 0, size: 100 } }),
        apiClient.get('/criterias').catch(() => []),
        apiClient.get('/point-categories').catch(() => []),
      ])
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
      const formatCriteria = createSv5tLabelFormatter(
        Array.isArray(criterias) ? criterias : Array.isArray(criterias?.data) ? criterias.data : [],
        { compact: true, shortMajor: true }
      )
      const formatCriteriaDetail = createSv5tLabelFormatter(
        Array.isArray(criterias) ? criterias : Array.isArray(criterias?.data) ? criterias.data : [],
        { shortMajor: true, codeWithChild: true }
      )
      // Registration eventInfo may omit the fanpage avatar. Fetch each missing fanpage once.
      const missingFanpageIds = [
        ...new Set(rawList.filter((raw) => !getOrganizerAvatar(raw)).map(getFanpageId)),
      ].filter(Boolean)
      const fanpages = new Map(
        await Promise.all(
          missingFanpageIds.map(async (id) => {
            try {
              const response: any = await apiClient.get(`/fanpages/${id}`)
              const fanpage = response?.data ?? response
              return [id, String(fanpage?.id) === id ? fanpage : null] as const
            } catch {
              return [id, null] as const
            }
          })
        )
      )
      return rawList.map((raw) => {
        const fanpage = fanpages.get(getFanpageId(raw))
        return normalizeRegisteredEvent(
          {
            ...raw,
            eventInfo: {
              ...raw.eventInfo,
              fanpageName: raw.eventInfo?.fanpageName || fanpage?.name,
              fanpageAvatarUrl: getOrganizerAvatar(raw) || fanpage?.avatarUrl,
            },
          },
          formatCriteria,
          formatCriteriaDetail,
          Array.isArray(pointCategories)
            ? pointCategories
            : Array.isArray(pointCategories?.data) ? pointCategories.data : []
        )
      })
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
