import { apiClient } from '@/shared'
import type { Event, EventFilters, EventLocation } from '../types/event.types'

/**
 * Normalizes backend /events DTO or mock item to frontend Event interface
 */
export function normalizeEvent(raw: any): Event {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '0',
      title: 'Sự kiện không xác định',
      description: '',
      category: 'WORKSHOP',
      status: 'PUBLISHED',
      startTime: '',
      endTime: '',
      location: { type: 'OFFLINE', address: 'Đại học Cần Thơ' },
      capacity: 100,
      registeredCount: 0,
      price: 0,
      organizerId: '1',
      organizerName: 'Ban Tổ Chức CTU',
      isModerationRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const organizerName = raw.organizerName || raw.fanpageName || 'Ban Tổ Chức CTU'
  const title = raw.title || raw.name || 'Sự kiện CTU'
  const startTime = raw.startTime || raw.dateHappen || raw.dateOpen || ''
  const endTime = raw.endTime || raw.dateClose || raw.dateHappen || startTime

  let location: EventLocation
  if (typeof raw.location === 'object' && raw.location !== null && raw.location.type) {
    location = raw.location
  } else if (typeof raw.location === 'string') {
    location = {
      type: raw.location.toLowerCase().includes('online') ? 'ONLINE' : 'OFFLINE',
      address: raw.location,
      city: 'Đại học Cần Thơ',
    }
  } else {
    location = {
      type: 'OFFLINE',
      address: 'Khu II, Đại học Cần Thơ',
      city: 'Cần Thơ',
    }
  }

  // Calculate points reward display string if eventPoints array is provided
  let pointsReward = raw.pointsReward
  if (!pointsReward && Array.isArray(raw.eventPoints) && raw.eventPoints.length > 0) {
    const total = raw.eventPoints.reduce((acc: number, p: any) => acc + (p.point || 0), 0)
    if (total > 0) {
      pointsReward = `+${total} Điểm rèn luyện`
    }
  }

  return {
    id: String(raw.id),
    title,
    description: raw.description || '',
    category: raw.category || 'WORKSHOP',
    status: raw.status || 'PUBLISHED',
    bannerUrl: raw.bannerUrl || undefined,
    startTime,
    endTime,
    location,
    capacity: Number(raw.capacity || 100),
    registeredCount: Number(raw.registeredCount || 0),
    price: Number(raw.price || 0),
    organizerId: String(raw.organizerId || raw.fanpageId || '1'),
    organizerName,
    organizerAvatarUrl: raw.organizerAvatarUrl || raw.fanpageAvatarUrl || undefined,
    fanpageName: organizerName,
    pointsReward,
    criteriaName: raw.criteriaName || raw.eventTypeName || undefined,
    eventPoints: Array.isArray(raw.eventPoints) ? raw.eventPoints : [],
    quotaText: raw.quotaText || (raw.capacity ? `Chỉ tiêu: ${raw.capacity} sinh viên` : undefined),
    isFollowed: Boolean(raw.isFollowed),
    isSaved: Boolean(raw.isSaved),
    timeAgo: raw.timeAgo || 'Gần đây',
    tags: Array.isArray(raw.tags) ? raw.tags : (raw.eventTypeName ? [raw.eventTypeName] : []),
    isModerationRequired: Boolean(raw.isModerationRequired),
    createdAt: raw.createdAt || raw.updatedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export const eventService = {
  /**
   * Fetches event list with optional category, search, and status filters.
   * Handles both Spring PageResponse (`content`) and direct array responses.
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const res: any = await apiClient.get('/events', { params: filters })
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
   * Fetches single event details by ID
   */
  async getEventById(id: string): Promise<Event> {
    const res = await apiClient.get(`/events/${id}`)
    return normalizeEvent(res)
  },

  /**
   * Creates a new event (organizer role required)
   */
  async createEvent(payload: Partial<Event>): Promise<Event> {
    return apiClient.post('/events', payload)
  },

  /**
   * Updates an existing event
   */
  async updateEvent(id: string, payload: Partial<Event>): Promise<Event> {
    return apiClient.put(`/events/${id}`, payload)
  },

  /**
   * Deletes an event by ID
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(`/events/${id}`)
  },
}
