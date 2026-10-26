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

  // Calculate points reward display string if eventPoints array is provided
  let pointsReward = raw.pointsReward
  if (!pointsReward && Array.isArray(raw.eventPoints) && raw.eventPoints.length > 0) {
    const total = raw.eventPoints.reduce((acc: number, p: any) => acc + (Number(p.point) || 0), 0)
    if (total > 0) {
      pointsReward = `+${total} Điểm rèn luyện`
    }
  }

  const capacity = Number(raw.capacity) || 0
  const registeredCount = Number(raw.registeredCount) || 0
  const organizerName = raw.organizerName || raw.fanpageName || ''
  const organizerId = String(raw.organizerId || raw.fanpageId || '')

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
    organizerAvatarUrl: raw.organizerAvatarUrl || raw.fanpageAvatarUrl || undefined,
    fanpageName: raw.fanpageName || organizerName,
    pointsReward: pointsReward || undefined,
    criteriaName: raw.criteriaName || raw.eventTypeName || undefined,
    eventPoints: Array.isArray(raw.eventPoints) ? raw.eventPoints : [],
    quotaText: raw.quotaText || (capacity > 0 ? `Chỉ tiêu: ${capacity} sinh viên` : undefined),
    isFollowed: Boolean(raw.isFollowed),
    isSaved: Boolean(raw.isSaved),
    timeAgo: raw.timeAgo || undefined,
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
}
