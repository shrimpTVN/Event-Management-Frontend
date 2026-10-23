export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'

export type EventCategory =
  'WORKSHOP' | 'CONFERENCE' | 'SEMINAR' | 'NETWORKING' | 'HACKATHON' | 'OTHER'

export interface EventPointReward {
  pointCategoryId: number
  pointCategoryName: string
  point: number
}

export interface EventLocation {
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  address?: string
  city?: string
  onlineMeetingUrl?: string
}

export interface Event {
  id: string
  title: string
  description: string
  category: EventCategory
  status: EventStatus
  bannerUrl?: string
  startTime: string
  endTime: string
  location: EventLocation
  capacity: number
  registeredCount: number
  price: number
  organizerId: string
  organizerName: string
  organizerAvatarUrl?: string
  pointsReward?: string
  criteriaName?: string
  fanpageName?: string
  eventPoints?: EventPointReward[]
  quotaText?: string
  isFollowed?: boolean
  isSaved?: boolean
  timeAgo?: string
  tags?: string[]
  isModerationRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface EventFilters {
  category?: EventCategory
  status?: EventStatus
  search?: string
  page?: number
  limit?: number
}
