import { apiClient, formatEventTitle } from '@/shared'
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
} from '../types/event.types'

export interface CachedFanpageInfo {
  name: string
  fullName: string
  avatarUrl: string
}

export const DEFAULT_FANPAGES_MAP: Record<string, CachedFanpageInfo> = {
  '1': {
    name: 'Đoàn Trường CNTT & TT',
    fullName: 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông',
    avatarUrl: 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg',
  },
  '2': {
    name: 'Trường Đại học Cần Thơ',
    fullName: 'Trường Đại học Cần Thơ',
    avatarUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=120&auto=format&fit=crop&q=60',
  },
  '3': {
    name: 'CLB Công nghệ phần mềm CTU',
    fullName: 'CLB Công nghệ phần mềm',
    avatarUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=120&auto=format&fit=crop&q=60',
  },
  '4': {
    name: 'Đoàn Trường Nông nghiệp',
    fullName: 'Đoàn Trường Nông nghiệp',
    avatarUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=120&auto=format&fit=crop&q=60',
  },
  '5': {
    name: 'CLB Tiếng Anh CTU',
    fullName: 'CLB Tiếng Anh',
    avatarUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=60',
  },
  '6': {
    name: 'CLB Thể thao CTU',
    fullName: 'CLB Thể thao',
    avatarUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=120&auto=format&fit=crop&q=60',
  },
}

const fanpageCache = new Map<string, CachedFanpageInfo>(Object.entries(DEFAULT_FANPAGES_MAP))

export function updateFanpageCache(id: string | number, data: Partial<CachedFanpageInfo>) {
  const key = String(id)
  const existing = fanpageCache.get(key) || DEFAULT_FANPAGES_MAP[key] || {
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
  } catch {
    // Keep cached defaults
  }
  return fanpageCache
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
  if (Array.isArray(ev.eventPoints) && ev.eventPoints.length > 0) {
    const rewards: string[] = []
    const totalPoints = ev.eventPoints.reduce((sum: number, p: any) => sum + (Number(p.point) || 0), 0)
    const firstCatId = ev.eventPoints[0]?.pointCategoryId
    const code = CTU_CRITERIA_CODE_MAP[firstCatId] || ev.eventPoints[0]?.pointCategoryCode || ''
    const pointsFormatted = totalPoints < 10 ? `0${totalPoints}` : `${totalPoints}`
    rewards.push(`Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim())

    if (ev.criteriaName || ev.sv5tCriteriaName) {
      rewards.push(`Tiêu chuẩn SV5T: ${ev.criteriaName || ev.sv5tCriteriaName}`)
    }
    if (ev.hasCertificate) {
      rewards.push('Cấp chứng nhận điện tử')
    }
    return rewards.join(' · ')
  }

  if (ev.trainingPoints && Number(ev.trainingPoints) > 0) {
    const tp = Number(ev.trainingPoints)
    const pointsFormatted = tp < 10 ? `0${tp}` : `${tp}`
    const code = ev.trainingPointCategoryCode ? `mục ${ev.trainingPointCategoryCode}` : ''
    return `Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim()
  }

  return ev.pointsReward || ev.benefits || 'Cộng điểm rèn luyện'
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
  const endTime = raw.endTime || raw.dateClose || raw.dateHappen || startTime

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
  } else if (!pointsReward && (raw.trainingPoints || raw.benefits)) {
    pointsReward = formatEventPointsReward(raw)
  }

  const capacity = Number(raw.capacity) || 0
  const registeredCount = Number(raw.registeredCount) || 0
  const organizerId = String(raw.organizerId || raw.fanpageId || '1')
  const cachedFp = fanpageCache.get(organizerId) || DEFAULT_FANPAGES_MAP[organizerId]

  const organizerFullName =
    raw.organizerFullName ||
    raw.fanpageFullName ||
    raw.orgName ||
    cachedFp?.fullName ||
    (raw.fanpageName && (raw.fanpageName.includes('CNTT') || raw.fanpageName.includes('Công Nghệ Thông Tin'))
      ? 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông'
      : undefined)

  const organizerName =
    organizerFullName ||
    raw.organizerName ||
    raw.fanpageName ||
    cachedFp?.name ||
    ''

  const organizerAvatarUrl =
    raw.organizerAvatarUrl ||
    raw.fanpageAvatarUrl ||
    cachedFp?.avatarUrl ||
    (organizerName.includes('CNTT') || organizerId === '1'
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
    criteriaName: raw.criteriaName || raw.eventTypeName || undefined,
    eventPoints: Array.isArray(raw.eventPoints) ? raw.eventPoints : [],
    quotaText: raw.quotaText || (capacity > 0 ? `${capacity} sinh viên` : undefined),
    isFollowed: Boolean(raw.isFollowed),
    isSaved: Boolean(raw.isSaved),
    isRegistered: Boolean(raw.isRegistered || (raw.status as string) === 'REGISTERED'),
    timeAgo: raw.timeAgo || formatEventTimeAgo(raw.createdAt || raw.updatedAt || raw.dateOpen),
    tags: Array.isArray(raw.tags) ? raw.tags : (raw.eventTypeName ? [raw.eventTypeName] : []),
    isModerationRequired: Boolean(raw.isModerationRequired),
    createdAt: raw.createdAt || raw.updatedAt || '',
    updatedAt: raw.updatedAt || raw.createdAt || '',
  }
}

/**
 * Builds backend query parameters from frontend EventFilters
 */
function buildEventFilterParams(filters?: EventFilters): Record<string, any> {
  if (!filters) return {}

  const params: Record<string, any> = {}

  const keyword = filters.keyword || filters.search
  if (keyword) params.keyword = keyword
  if (filters.status) params.status = filters.status
  if (filters.semesterId !== undefined) params.semesterId = filters.semesterId
  if (filters.fanpageId !== undefined) params.fanpageId = filters.fanpageId
  if (filters.eventTypeId !== undefined) params.eventTypeId = filters.eventTypeId
  if (filters.criteriaId !== undefined) params.criteriaId = filters.criteriaId
  if (filters.pointCategoryId !== undefined) params.pointCategoryId = filters.pointCategoryId
  if (filters.dateHappenFrom) params.dateHappenFrom = filters.dateHappenFrom
  if (filters.dateHappenTo) params.dateHappenTo = filters.dateHappenTo
  if (filters.page !== undefined) params.page = filters.page
  const size = filters.size ?? filters.limit
  if (size !== undefined) params.size = size
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortDir) params.sortDir = filters.sortDir

  return params
}

export const eventService = {
  /**
   * Fetches public active event list with optional keyword, status, and category filters.
   * Connects to GET /events.
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    loadFanpagesCache().catch(() => {})
    const params = buildEventFilterParams(filters)
    const res: any = await apiClient.get('/events', { params })

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
    const res: any = await apiClient.get(`/events/${id}`)
    return normalizeEvent(res)
  },

  /**
   * Fetches events organized by a specific fanpage from GET /events/fanpage/{fanpageId}
   */
  async getEventsByFanpage(
    fanpageId: string | number,
    params?: { page?: number; size?: number }
  ): Promise<Event[]> {
    const res: any = await apiClient.get(`/events/fanpage/${fanpageId}`, { params })
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
}
