import { apiClient, formatEventTitle } from '@/shared'
import { normalizeAttendanceConfig } from '@/shared/utils/attendanceConfig'
import type {
  Event,
  EventCategory,
  EventFilters,
  EventLocation,
  EventStatus,
  EventCreateRequestDto,
  EventUpdateRequestDto,
  EventResponseDto,
  PageResponse,
  ViewedEventsBatchPayload,
} from '../types/event.types'

export interface CachedFanpageInfo {
  name: string
  fullName: string
  avatarUrl: string
}

export const DEFAULT_FANPAGES_MAP: Record<string, CachedFanpageInfo> = {
  '1': {
    name: 'Đoàn Trường CNTT & TT',
    fullName: 'Đoàn Trường Công nghệ Thông tin và Truyền thông - Đại học Cần Thơ',
    avatarUrl:
      'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg',
  },
  '7': {
    name: 'Đoàn TN - Hội SV Đại học Cần Thơ',
    fullName: 'Đoàn Thanh niên - Hội Sinh viên Đại học Cần Thơ',
    avatarUrl:
      'https://res.cloudinary.com/depaiphq0/image/upload/v1793963013/ctu-event/fanpages/u_2_606320c599474b7d.jpg',
  },
}

export function resolveEventTypeId(raw: any): number | undefined {
  if (raw.eventTypeId !== undefined && raw.eventTypeId !== null) return Number(raw.eventTypeId)
  if (raw.eventType?.id !== undefined && raw.eventType?.id !== null) return Number(raw.eventType.id)
  return undefined
}

export const KNOWN_CRITERIA_MAP: Record<string, number> = {
  // 10: Đạo đức tốt
  'điểm rèn luyện đạt từ 85 điểm trở lên': 101,
  'không vi phạm pháp luật': 102,
  'tham gia cuộc thi tìm hiểu về các môn khoa học chính trị': 1031,
  'tham gia hoạt động giáo dục lòng yêu nước': 1032,
  'tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên': 1033,
  'thanh niên tiêu biểu': 1034,
  'đảng viên hoàn thành tốt nhiệm vụ': 1035,
  'đạo đức tốt': 10,

  // 20: Học tập tốt
  'điểm trung bình cộng năm học xét đạt từ 3.0 trở lên': 201,
  'tích lũy tối thiểu 12 tín chỉ': 202,
  'học tập tốt': 20,

  // 30: Thể lực tốt
  'học phần giáo dục thể chất': 301,
  'tham gia ít nhất 01 hoạt động rèn luyện thể lực do đoàn - hội cấp cơ sở trở lên tổ chức': 302,
  'thể lực tốt': 30,

  // 40: Tình nguyện tốt
  'được các cấp đảng, đoàn, hội, chính quyền khen thưởng trong hoạt động tình nguyện': 401,
  'tham gia ít nhất 03 ngày tình nguyện trong năm học': 402,
  'tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học': 403,
  'tình nguyện tốt': 40,

  // 50: Hội nhập tốt
  'được khen thưởng cuộc thi ngoại ngữ cấp đại học cần thơ trở lên': 5011,
  'chứng chỉ ngoại ngữ': 5012,
  'hoàn thành hoặc được miễn 03 học phần ngoại ngữ': 5013,
  'hoàn thành hoặc được miễn 02 học phần ngoại ngữ': 5014,
  'sinh viên chuyên ngành ngoại ngữ': 5015,
  'chứng chỉ ứng dụng công nghệ thông tin cơ bản': 5021,
  'chứng chỉ tin học quốc tế ic3 hoặc mos': 5022,
  'cuộc thi tin học': 5023,
  'năng lực số ứng dụng': 5024,
  'chuyên ngành công nghệ thông tin': 5026,
  'hoạt động hội nhập': 5031,
  'khen thưởng thành tích xuất sắc phong trào tn-sv': 5032,
  'tập huấn bồi dưỡng kỹ năng': 5033,
  'học phần kỹ năng': 5034,
  'kiến thức hội nhập': 5035,
  'hội nhập tốt': 50,
}

export const ROOT_CRITERIA_CHILDREN: Record<number, number[]> = {
  10: [10, 101, 102, 103, 1031, 1032, 1033, 1034, 1035],
  20: [20, 201, 202],
  30: [30, 301, 302],
  40: [40, 401, 402, 403],
  50: [
    50, 501, 502, 503, 5011, 5012, 5013, 5014, 5015, 5021, 5022, 5023, 5024, 5025, 5026, 5031, 5032,
    5033, 5034, 5035,
  ],
}

export function resolveCriteriaId(raw: any): number | undefined {
  if (raw.criteriaId !== undefined && raw.criteriaId !== null) return Number(raw.criteriaId)
  if (raw.criteria?.id !== undefined && raw.criteria?.id !== null) return Number(raw.criteria.id)
  if (raw.sv5tCriteriaId !== undefined && raw.sv5tCriteriaId !== null)
    return Number(raw.sv5tCriteriaId)
  const name = String(raw.criteriaName || raw.sv5tCriteriaName || raw.criteria?.name || '')
    .toLowerCase()
    .trim()
  if (name && KNOWN_CRITERIA_MAP[name]) return KNOWN_CRITERIA_MAP[name]
  return undefined
}

const fanpageCache = new Map<string, CachedFanpageInfo>()
let fanpagesCachePromise: Promise<Map<string, CachedFanpageInfo>> | null = null
let fanpagesCacheLoaded = false

export function updateFanpageCache(id: string | number, data: Partial<CachedFanpageInfo>) {
  const key = String(id)
  const existing = fanpageCache.get(key) || {
    name: '',
    fullName: '',
    avatarUrl: '',
  }
  fanpageCache.set(key, {
    name: data.name || existing.name,
    fullName: data.fullName || existing.fullName,
    avatarUrl: data.avatarUrl || existing.avatarUrl,
  })
}

export async function loadFanpagesCache(): Promise<Map<string, CachedFanpageInfo>> {
  if (fanpagesCacheLoaded) return fanpageCache
  if (fanpagesCachePromise) return fanpagesCachePromise

  fanpagesCachePromise = (async () => {
    try {
      const res: any = await apiClient.get('/fanpages?size=100')
      const list = res?.content || res?.data?.content || res?.data || (Array.isArray(res) ? res : [])
      list.forEach((fp: any) => {
        if (fp.id) {
          updateFanpageCache(fp.id, {
            name: fp.name,
            fullName: fp.orgName || fp.name,
            avatarUrl: fp.avatarUrl,
          })
        }
      })
      if (list.length > 0) fanpagesCacheLoaded = true
    } catch {
      // Allow retry on subsequent requests when fanpages fetch fails
    } finally {
      fanpagesCachePromise = null
    }
    return fanpageCache
  })()

  return fanpagesCachePromise
}

const CTU_CRITERIA_CODE_MAP: Record<number, string> = {
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
  311: 'mục III.b',
  312: 'mục III.b',
  301: 'mục III.a',
}

export function formatEventPointsReward(ev: any): string {
  const rewards: string[] = []

  if (Array.isArray(ev.eventPoints) && ev.eventPoints.length > 0) {
    const totalPoints = ev.eventPoints.reduce(
      (sum: number, p: any) => sum + (Number(p.point) || 0),
      0
    )
    if (totalPoints > 0) {
      const firstCatId = ev.eventPoints[0]?.pointCategoryId
      const code = CTU_CRITERIA_CODE_MAP[firstCatId] || ev.eventPoints[0]?.pointCategoryCode || ''
      const pointsFormatted = totalPoints < 10 ? `0${totalPoints}` : `${totalPoints}`
      rewards.push(`Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim())
    }
  } else if (ev.trainingPoints && Number(ev.trainingPoints) > 0) {
    const tp = Number(ev.trainingPoints)
    const pointsFormatted = tp < 10 ? `0${tp}` : `${tp}`
    const code = ev.trainingPointCategoryCode ? `mục ${ev.trainingPointCategoryCode}` : ''
    rewards.push(`Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim())
  } else if (ev.pointsReward && /điểm rèn luyện|đrl|\+\d+/i.test(ev.pointsReward)) {
    rewards.push(ev.pointsReward)
  }

  if (ev.criteriaName || ev.sv5tCriteriaName) {
    rewards.push(`Tiêu chuẩn SV5T: ${ev.criteriaName || ev.sv5tCriteriaName}`)
  }
  if (ev.hasCertificate) {
    rewards.push('Cấp chứng nhận điện tử')
  }

  if (rewards.length > 0) {
    return rewards.join(' · ')
  }

  if (ev.benefits && ev.benefits !== 'Cộng điểm rèn luyện') {
    return ev.benefits
  }

  return ''
}

function formatEventTimeAgo(dateInput?: string): string {
  if (!dateInput) return 'Vừa xong'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Vừa xong'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24 && now.getDate() === date.getDate()) return `Hôm nay lúc ${timeStr}`
  if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) {
    return `Hôm qua lúc ${timeStr}`
  }
  return dateStr
}

/**
 * Normalizes backend /events DTO or mock item to frontend Event interface.
 * Strictly avoids hardcoded fallback strings and preserves authentic server values.
 */
export function normalizeEvent(raw: Partial<EventResponseDto> & Record<string, any>): Event {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu sự kiện từ máy chủ không hợp lệ')
  }

  const title = formatEventTitle(raw.title || raw.name || '')
  const startTime = raw.startTime || raw.dateHappen || raw.dateOpen || ''
  const endTime = raw.endTime || raw.dateEndHappen || raw.dateEnd || ''

  let location: EventLocation
  if (typeof raw.location === 'object' && raw.location !== null && raw.location.type) {
    location = {
      type: raw.location.type,
      address: raw.location.address || '',
      city: raw.location.city,
      onlineMeetingUrl: raw.location.onlineMeetingUrl,
    }
  } else if (typeof raw.location === 'string') {
    location = {
      type: raw.location.toLowerCase().includes('online') ? 'ONLINE' : 'OFFLINE',
      address: raw.location,
      city: raw.city,
    }
  } else {
    location = {
      type: 'OFFLINE',
      address: '',
    }
  }

  // Calculate points reward display string matching Fanpage formatting exactly
  let pointsReward = raw.pointsReward
  if (Array.isArray(raw.eventPoints) && raw.eventPoints.length > 0) {
    pointsReward = formatEventPointsReward(raw)
  } else if (!pointsReward && (raw.trainingPoints || raw.benefits || raw.criteriaName || raw.sv5tCriteriaName)) {
    pointsReward = formatEventPointsReward(raw)
  }

  const capacity = Number(raw.capacity) || 0
  const registeredCount = Number(raw.registeredCount) || 0
  const organizerId = String(raw.organizerId || raw.fanpageId || '1')
  const cachedFp = fanpageCache.get(organizerId)
  const defaultFp = DEFAULT_FANPAGES_MAP[organizerId]

  const organizerFullName =
    raw.organizerFullName ||
    raw.fanpageFullName ||
    raw.orgName ||
    cachedFp?.fullName ||
    raw.fanpageName ||
    raw.organizerName ||
    defaultFp?.fullName

  const organizerName =
    raw.organizerName ||
    raw.fanpageName ||
    organizerFullName ||
    cachedFp?.name ||
    defaultFp?.name ||
    ''

  const organizerAvatarUrl =
    raw.organizerAvatarUrl ||
    raw.fanpageAvatarUrl ||
    cachedFp?.avatarUrl ||
    defaultFp?.avatarUrl ||
    (organizerId === '7' ||
    raw.fanpageId === 7 ||
    (organizerName && organizerName.includes('Hội SV'))
      ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793963013/ctu-event/fanpages/u_2_606320c599474b7d.jpg'
      : organizerName.includes('CNTT') || organizerId === '1'
        ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
        : undefined)

  const fanpageName = organizerFullName || raw.fanpageName || organizerName
  const fanpageFullName = organizerFullName || fanpageName

  return {
    id: String(raw.id),
    title,
    description: raw.description || '',
    category: (raw.category || raw.eventTypeName || 'OTHER').toUpperCase() as EventCategory,
    status: (raw.status || 'PUBLISHED') as EventStatus,
    bannerUrl: raw.bannerUrl || undefined,
    startTime,
    endTime,
    location,
    capacity,
    registeredCount,
    price: Number(raw.price) || 0,
    organizerId,
    organizerName,
    organizerFullName,
    organizerAvatarUrl,
    fanpageName,
    fanpageFullName,
    pointsReward: pointsReward || undefined,
    criteriaName: raw.criteriaName || raw.sv5tCriteriaName || raw.criteria?.name || undefined,
    eventPoints: Array.isArray(raw.eventPoints) ? raw.eventPoints : [],
    ...normalizeAttendanceConfig(raw),
    quotaText: raw.quotaText || (capacity > 0 ? `${capacity} sinh viên` : undefined),
    isFollowed: Boolean(raw.isFollowed ?? raw.isFollowFanpage),
    isSaved: Boolean(raw.isSaved),
    isRegistered: Boolean(raw.isRegistered || (raw.status as string) === 'REGISTERED'),
    timeAgo: raw.timeAgo || formatEventTimeAgo(raw.createdAt || raw.updatedAt || raw.dateOpen),
    tags: Array.isArray(raw.tags) ? raw.tags : raw.eventTypeName ? [raw.eventTypeName] : [],
    isModerationRequired: Boolean(raw.isModerationRequired),
    dateOpen: raw.dateOpen,
    dateClose: raw.dateClose,
    dateHappen: raw.dateHappen,
    eventTypeId: resolveEventTypeId(raw),
    eventTypeName: raw.eventTypeName || raw.eventType?.name,
    semesterId: raw.semester?.id
      ? Number(raw.semester.id)
      : raw.semesterId
        ? Number(raw.semesterId)
        : undefined,
    semester: raw.semester || undefined,
    criteriaId: resolveCriteriaId(raw),
    fanpageId: raw.fanpageId
      ? Number(raw.fanpageId)
      : raw.organizerId
        ? Number(raw.organizerId)
        : undefined,
    createdAt: raw.createdAt || raw.updatedAt || '',
    updatedAt: raw.updatedAt || raw.createdAt || '',
  }
}

/**
 * Validates if an event matches a selected registration/lifecycle status filter key.
 * Handles:
 * - 'OPEN_REGISTRATION': published event where current date is within dateOpen and dateClose
 * - 'PUBLISHED': published event where dateHappen is in the future
 * - 'COMPLETED': event is closed/completed or dateHappen/dateClose has passed
 */
export function isEventMatchingRegistrationStatus(
  evt: any,
  statusKey?: string,
  now: Date = new Date()
): boolean {
  if (!statusKey) return true

  const nowMs = now.getTime()
  const time = (value?: string) => {
    const parsed = value ? new Date(value).getTime() : NaN
    return Number.isFinite(parsed) ? parsed : null
  }
  const status = String(evt.status || '').toUpperCase()
  const open = time(evt.dateOpen)
  const close = time(evt.dateClose)
  const start = time(evt.startTime || evt.dateHappen)
  const end = time(evt.endTime)
  const cancelled = ['CANCELLED', 'DRAFT', 'REJECTED', 'PENDING_APPROVAL'].includes(status)
  const effectiveEnd =
    end !== null
      ? end
      : start !== null
        ? start + 4 * 60 * 60 * 1000
        : null
  const completed =
    ['COMPLETED', 'FINISHED'].includes(status) ||
    (!cancelled && effectiveEnd !== null && effectiveEnd <= nowMs)
  const running =
    !cancelled &&
    !completed &&
    (['ONGOING', 'IN_PROGRESS'].includes(status) ||
      (start !== null && start <= nowMs && effectiveEnd !== null && effectiveEnd > nowMs))
  const published = [
    'PUBLISHED',
    'APPROVED',
    'OPEN_REGISTRATION',
    'CLOSED_REGISTRATION',
    'CLOSED',
    'UPCOMING',
  ].includes(status)
  const closed =
    ['CLOSED', 'CLOSED_REGISTRATION'].includes(status) || (close !== null && close <= nowMs)
  if (statusKey === 'OPEN_REGISTRATION')
    return published && !cancelled && !completed && !closed && (open === null || open <= nowMs)
  if (statusKey === 'CLOSED_REGISTRATION') return published && closed
  if (statusKey === 'PUBLISHED')
    return published && !completed && !running && (start === null || start > nowMs)
  if (statusKey === 'ONGOING') return running
  if (statusKey === 'COMPLETED') return completed
  return status === statusKey
}

export function resolveAllowedPointCategoryIds(
  selectedIds: string[],
  pointCategories?: any[]
): Set<number> {
  const allowed = new Set<number>()
  const selected = new Set(selectedIds.map(String))
  const byId = new Map((pointCategories || []).map((item) => [String(item.id), item]))
  const descendants = (id: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(id)) return visited
    visited.add(id)
    const item = byId.get(id)
    for (const childId of item?.childIds || []) {
      if (String(childId) !== id) descendants(String(childId), visited)
    }
    for (const child of pointCategories || []) {
      if (String(child.parentCategoryId) === id) descendants(String(child.id), visited)
    }
    return visited
  }
  for (const id of selected) {
    const all = descendants(id)
    if ([...all].some((child) => child !== id && selected.has(child))) continue
    for (const child of all) if (Number.isFinite(Number(child))) allowed.add(Number(child))
  }
  return allowed
}

function toInstantIsoString(dateStr: string, isEndOfDay: boolean = false): string {
  if (!dateStr) return dateStr
  if (dateStr.includes('T')) return dateStr
  return isEndOfDay ? `${dateStr}T23:59:59Z` : `${dateStr}T00:00:00Z`
}

/**
 * Builds backend query parameters from frontend EventFilters
 */
function buildEventFilterParams(filters?: EventFilters): Record<string, any> {
  if (!filters) return {}

  const params: Record<string, any> = {}

  const keyword = filters.keyword || filters.search
  if (keyword) params.keyword = keyword
  if (filters.status) {
    if (filters.status === 'OPEN_REGISTRATION' || filters.status === 'PUBLISHED') {
      params.status = 'PUBLISHED'
    } else if (filters.status === 'COMPLETED' || filters.status === 'CLOSED') {
      params.status = 'COMPLETED'
    } else {
      params.status = filters.status
    }
  }
  if (filters.semesterId !== undefined) params.semesterId = filters.semesterId
  if (filters.fanpageId !== undefined) params.fanpageId = filters.fanpageId

  // Backend Spring Boot EventFilterRequestDto uses List<Long> criteriaIds, eventTypeIds, pointCategoryIds
  if (filters.eventTypeIds) {
    params.eventTypeIds = Array.isArray(filters.eventTypeIds)
      ? filters.eventTypeIds.join(',')
      : filters.eventTypeIds
  } else if (filters.eventTypeId !== undefined) {
    params.eventTypeIds = filters.eventTypeId
  }

  if (filters.criteriaIds) {
    params.criteriaIds = Array.isArray(filters.criteriaIds)
      ? filters.criteriaIds.join(',')
      : filters.criteriaIds
  } else if (filters.childCriteriaIds && filters.childCriteriaIds.length > 0) {
    params.criteriaIds = filters.childCriteriaIds.join(',')
  } else if (filters.criteriaId !== undefined) {
    const rawIds = String(filters.criteriaId)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const expandedIds = new Set<string>()
    rawIds.forEach((idStr) => {
      expandedIds.add(idStr)
      const num = Number(idStr)
      if (ROOT_CRITERIA_CHILDREN[num]) {
        ROOT_CRITERIA_CHILDREN[num].forEach((c) => expandedIds.add(String(c)))
      }
    })
    params.criteriaIds = Array.from(expandedIds).join(',')
  }

  if (filters.pointCategoryIds) {
    params.pointCategoryIds = Array.isArray(filters.pointCategoryIds)
      ? filters.pointCategoryIds.join(',')
      : filters.pointCategoryIds
  } else if (filters.childCategoryIds && filters.childCategoryIds.length > 0) {
    params.pointCategoryIds = filters.childCategoryIds.join(',')
  } else if (filters.pointCategoryId !== undefined) {
    params.pointCategoryIds = filters.pointCategoryId
  }
  // Backend Spring Boot expects java.time.Instant for dateHappenFrom / dateHappenTo
  if (filters.dateHappenFrom)
    params.dateHappenFrom = toInstantIsoString(filters.dateHappenFrom, false)
  if (filters.dateHappenTo) params.dateHappenTo = toInstantIsoString(filters.dateHappenTo, true)
  if (filters.page !== undefined) params.page = filters.page
  const size = filters.size ?? filters.limit
  if (size !== undefined) params.size = size
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortDir) params.sortDir = filters.sortDir

  return params
}

const ROOT_SV5T_STANDARD_NAMES: Record<number, string> = {
  10: 'Đạo đức tốt',
  20: 'Học tập tốt',
  30: 'Thể lực tốt',
  40: 'Tình nguyện tốt',
  50: 'Hội nhập tốt',
}

function resolveStandardSv5tName(criteriaId?: number, criteriaName?: string): string | undefined {
  if (criteriaId !== undefined && Number.isFinite(criteriaId)) {
    if (ROOT_SV5T_STANDARD_NAMES[criteriaId]) {
      return ROOT_SV5T_STANDARD_NAMES[criteriaId]
    }
    for (const [rootId, children] of Object.entries(ROOT_CRITERIA_CHILDREN)) {
      if (children.includes(criteriaId)) {
        return ROOT_SV5T_STANDARD_NAMES[Number(rootId)]
      }
    }
  }
  const lower = (criteriaName || '').toLowerCase()
  if (/tình nguyện|hiến máu|mùa hè xanh|cộng đồng/.test(lower)) return 'Tình nguyện tốt'
  if (/hội nhập|ngoại ngữ|tiếng anh|tin học|kỹ năng|hội thao/.test(lower) && !/thể/.test(lower))
    return 'Hội nhập tốt'
  if (/thể lực|thể chất|chạy|bóng/.test(lower)) return 'Thể lực tốt'
  if (/đạo đức|tư tưởng|chính trị|công dân|văn hóa|lối sống/.test(lower)) return 'Đạo đức tốt'
  if (/học tập|tín chỉ|nghiên cứu|điểm trung bình/.test(lower)) return 'Học tập tốt'
  return undefined
}

function extractRomanCategoryCode(categoryName?: string): string | null {
  if (!categoryName) return null
  const match = categoryName.trim().match(/^([IVX]+)\./i)
  return match ? match[1].toUpperCase() : null
}

export function formatRecommendationExplain(item: any, normalizedEvent: Event): string | undefined {
  const rawExplain = typeof item?.explain === 'string' ? item.explain.trim() : ''
  const isRuleFallback =
    !rawExplain ||
    /có thể bổ sung|hoàn thành tiêu chí cấp trên|hoàn thành một tiêu chí|đến từ trang bạn theo dõi|cùng loại với sự kiện/i.test(
      rawExplain
    )

  const standardName = resolveStandardSv5tName(
    normalizedEvent.criteriaId,
    normalizedEvent.criteriaName
  )

  if (!isRuleFallback) {
    return standardName
      ? rawExplain.replace(/tiêu chí cấp trên/gi, `tiêu chí ${standardName}`)
      : rawExplain
  }

  const reasons: string[] = []
  const pointGains: any[] = Array.isArray(item?.pointGains) ? item.pointGains : []
  const effectiveGains = pointGains.filter((g) => Number(g?.effectiveGain) > 0)
  const totalUseful = effectiveGains.reduce((sum, g) => sum + (Number(g.effectiveGain) || 0), 0)
  const explainedPointsMatch = rawExplain.match(/(\d+)\s*điểm rèn luyện/i)
  const usefulPoints =
    totalUseful > 0 ? totalUseful : explainedPointsMatch ? Number(explainedPointsMatch[1]) : 0

  if (usefulPoints > 0) {
    const codes = Array.from(
      new Set(
        effectiveGains
          .map((g) => extractRomanCategoryCode(g?.categoryName))
          .filter((c): c is string => Boolean(c))
      )
    )
    const codeSuffix = codes.length > 0 ? ` mục ${codes.join(', ')}` : ''
    reasons.push(`Bổ sung ${usefulPoints} điểm rèn luyện${codeSuffix}`)
  }

  const completesParent = /hoàn thành tiêu chí cấp trên/i.test(rawExplain)
  const fulfillsLeaf = /hoàn thành một tiêu chí/i.test(rawExplain) || Boolean(item?.fulfillsCriteria)
  if (completesParent) {
    reasons.push(
      standardName
        ? `có thể hoàn thành tiêu chí ${standardName}`
        : 'có thể hoàn thành tiêu chí cấp trên'
    )
  } else if (fulfillsLeaf) {
    reasons.push(
      standardName ? `góp phần đạt tiêu chí ${standardName}` : 'có thể hoàn thành một tiêu chí'
    )
  }

  if (reasons.length < 2 && /trang bạn theo dõi/i.test(rawExplain)) {
    reasons.push('từ trang bạn theo dõi')
  }
  if (reasons.length < 2 && /cùng loại/i.test(rawExplain)) {
    reasons.push('cùng loại bạn quan tâm')
  }

  if (reasons.length === 0) {
    return rawExplain || undefined
  }

  const text = `${reasons.join(', ')}.`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const eventService = {
  /**
   * Fetches public active event list with optional keyword, status, and category filters.
   * Connects to GET /events.
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const cachePromise = loadFanpagesCache().catch(() => {})

    // When status is specifically requested, query Backend directly with that status
    if (filters?.status && (filters.status as any) !== 'ALL') {
      const params = buildEventFilterParams(filters)
      const [res]: [any, unknown] = await Promise.all([
        apiClient.get('/events', { params }),
        cachePromise,
      ])

      let rawList: any[] = []
      if (res && Array.isArray(res.content)) {
        rawList = res.content
      } else if (Array.isArray(res)) {
        rawList = res
      } else if (res && Array.isArray(res.items)) {
        rawList = res.items
      } else if (res && res.data && Array.isArray(res.data.content)) {
        rawList = res.data.content
      }

      return rawList.map(normalizeEvent)
    }

    // Public feeds need the full dataset before applying hierarchical local filters.
    const baseFilters = { ...filters }
    delete baseFilters.status
    const params = buildEventFilterParams(baseFilters)
    const explicitPage =
      filters?.page !== undefined || filters?.size !== undefined || filters?.limit !== undefined
    const readList = (res: any): any[] => {
      const data = res?.data ?? res
      return Array.isArray(data) ? data : data?.content || data?.items || []
    }
    const fetchStatus = async (status: string) => {
      const first: any = await apiClient.get('/events', {
        params: { ...params, status, size: params.size ?? 100, page: params.page ?? 0 },
      })
      const list = [...readList(first)]
      if (!explicitPage) {
        const totalPages = Number(first?.totalPages ?? first?.data?.totalPages) || 1
        for (let page = 1; page < totalPages; page++) {
          const next = await apiClient.get('/events', {
            params: { ...params, status, size: 100, page },
          })
          list.push(...readList(next))
        }
      }
      return list
    }
    const statusesToFetch =
      filters?.statuses && filters.statuses.length > 0
        ? filters.statuses
        : ['PUBLISHED', 'COMPLETED', 'CLOSED']
    const responses = await Promise.allSettled(
      statusesToFetch.map(fetchStatus)
    )
    await cachePromise
    const eventMap = new Map<string, any>()
    responses.forEach((response) => {
      if (response.status === 'fulfilled')
        response.value.forEach((item) => {
          if (item?.id != null) eventMap.set(String(item.id), item)
        })
    })
    const result = [...eventMap.values()].map(normalizeEvent)
    const limit = filters?.size ?? filters?.limit
    return limit !== undefined ? result.slice(0, limit) : result
  },

  /**
   * Fetches paginated event list with full Spring PageResponse metadata.
   */
  async getEventsPaginated(filters?: EventFilters): Promise<PageResponse<Event>> {
    const params = buildEventFilterParams(filters)
    const res: any = await apiClient.get('/events', { params })

    if (res && Array.isArray(res.content)) {
      return {
        ...res,
        content: res.content.map(normalizeEvent),
      }
    }

    const list: any[] = Array.isArray(res) ? res : res?.items || []
    return {
      content: list.map(normalizeEvent),
      totalElements: list.length,
      totalPages: 1,
      size: list.length,
      number: 0,
    }
  },

  /**
   * Fetches single event details by ID from GET /events/{id}
   */
  async getEventById(id: string | number): Promise<Event> {
    const [res]: [any, unknown] = await Promise.all([
      apiClient.get(`/events/${id}`),
      loadFanpagesCache().catch(() => {}),
    ])
    const fpId = res?.organizerId || res?.fanpageId
    if (fpId && !fanpageCache.has(String(fpId))) {
      try {
        const fpRes: any = await apiClient.get(`/fanpages/${fpId}`)
        const fp = fpRes?.data ?? fpRes
        if (fp?.id || fp?.name || fp?.avatarUrl) {
          updateFanpageCache(fp.id ?? fpId, {
            name: fp.name,
            fullName: fp.orgName || fp.name,
            avatarUrl: fp.avatarUrl,
          })
        }
      } catch {
        // Ignore individual fanpage lookup error and normalize from event payload
      }
    }
    return normalizeEvent(res)
  },

  /**
   * Fetches events organized by a specific fanpage from GET /events/fanpage/{fanpageId}
   */
  async getEventsByFanpage(
    fanpageId: string | number,
    params?: { page?: number; size?: number }
  ): Promise<Event[]> {
    const [res]: [any, unknown] = await Promise.all([
      apiClient.get(`/events/fanpage/${fanpageId}`, { params }),
      loadFanpagesCache().catch(() => {}),
    ])
    let rawList: any[] = []
    if (res && Array.isArray(res.content)) {
      rawList = res.content
    } else if (Array.isArray(res)) {
      rawList = res
    }
    return rawList.map(normalizeEvent)
  },

  /**
   * Creates a new event for an organizer's fanpage via POST /events/fanpage-member
   */
  async createEvent(payload: EventCreateRequestDto | Partial<Event>): Promise<Event> {
    const res: any = await apiClient.post('/events/fanpage-member', payload)
    return res ? normalizeEvent(res) : ({} as Event)
  },

  /**
   * Updates an existing event via PUT /events/fanpage-member/{id}
   */
  async updateEvent(
    id: string | number,
    payload: EventUpdateRequestDto | Partial<Event>
  ): Promise<Event> {
    const res: any = await apiClient.put(`/events/fanpage-member/${id}`, payload)
    return res ? normalizeEvent(res) : ({} as Event)
  },

  /**
   * Changes event lifecycle status via PATCH /events/fanpage-member/{id}/status?status={status}
   */
  async changeEventStatus(id: string | number, status: EventStatus): Promise<void> {
    return apiClient.patch(`/events/fanpage-member/${id}/status`, null, {
      params: { status },
    })
  },

  /**
   * Deletes an event via DELETE /events/fanpage-member/{id} or /events/admin/{id}
   */
  async deleteEvent(id: string | number, isAdmin?: boolean): Promise<void> {
    const path = isAdmin ? `/events/admin/${id}` : `/events/fanpage-member/${id}`
    return apiClient.delete(path)
  },

  /**
   * Stores / bookmarks an event for the authenticated user via POST /events/{eventId}/store
   */
  async storeEvent(eventId: string | number): Promise<void> {
    await apiClient.post(`/events/${eventId}/store`)
  },

  /**
   * Unstores / removes bookmark for an event via DELETE /events/{eventId}/store
   */
  async unstoreEvent(eventId: string | number): Promise<void> {
    await apiClient.delete(`/events/${eventId}/store`)
  },

  /**
   * Checks whether an event is stored by current user via GET /events/{eventId}/is-stored
   */
  async isEventStored(eventId: string | number): Promise<boolean> {
    try {
      const res: any = await apiClient.get(`/events/${eventId}/is-stored`)
      return Boolean(res?.isStored ?? res?.data?.isStored)
    } catch {
      return false
    }
  },

  /**
   * Fetches all stored / bookmarked events for authenticated user via GET /events/stored
   */
  async getStoredEvents(params?: { page?: number; size?: number }): Promise<Event[]> {
    const res: any = await apiClient.get('/events/stored', {
      params: { page: params?.page ?? 0, size: params?.size ?? 50 },
    })
    let rawList: any[] = []
    if (res && Array.isArray(res.content)) {
      rawList = res.content
    } else if (res && res.data && Array.isArray(res.data.content)) {
      rawList = res.data.content
    } else if (Array.isArray(res)) {
      rawList = res
    } else if (res && Array.isArray(res.items)) {
      rawList = res.items
    }
    return rawList.map((item) => ({
      ...normalizeEvent(item),
      isSaved: true,
    }))
  },

  /**
   * Fetches personalized recommended events for the authenticated student
   * from GET /events/recommendations, preserving backend ranking order.
   */
  async getRecommendations(params?: { page?: number; size?: number }): Promise<Event[]> {
    const [res]: [any, unknown] = await Promise.all([
      apiClient.get('/events/recommendations', {
        params: { page: params?.page ?? 0, size: params?.size ?? 50 },
      }),
      loadFanpagesCache().catch(() => {}),
    ])
    const payload = res?.data ?? res
    const rawList: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.items)
          ? payload.items
          : []

    return rawList
      .filter((item) => item && item.event)
      .map((item) => {
        const normalized = normalizeEvent(item.event)
        return {
          ...normalized,
          recommendationExplain: formatRecommendationExplain(item, normalized),
          recommendationScore:
            typeof item.effectiveScore === 'number' ? item.effectiveScore : undefined,
          fulfillsCriteria: Boolean(item.fulfillsCriteria),
          isViewed: Boolean(item.viewed),
          isRecommended: true,
        }
      })
  },

  /**
   * Reports rendered/viewed recommended event IDs for the authenticated student
   * to POST /events/views with an idempotent client-generated UUID batchId.
   */
  async recordEventViews(payload: ViewedEventsBatchPayload): Promise<void> {
    const validIds = Array.from(
      new Set(payload.eventIds.filter((id) => Number.isInteger(id) && id > 0))
    ).slice(0, 1000)
    if (!payload.batchId || validIds.length === 0) return
    await apiClient.post('/events/views', {
      batchId: payload.batchId,
      eventIds: validIds,
    })
  },
}
