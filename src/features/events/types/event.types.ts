export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'OPEN_REGISTRATION'
  | 'CLOSED_REGISTRATION'
  | 'IN_PROGRESS'
  | 'FINISHED'

export type EventCategory =
  | 'WORKSHOP'
  | 'CONFERENCE'
  | 'SEMINAR'
  | 'NETWORKING'
  | 'HACKATHON'
  | 'VOLUNTEER'
  | 'SPORTS'
  | 'ACADEMIC'
  | 'OTHER'

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

export interface EventSemester {
  id: number
  number: number
  academicYear: string
  startDate: string
  endDate: string
  status: string
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
  isRegistered?: boolean
  timeAgo?: string
  tags?: string[]
  isModerationRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface EventFilters {
  keyword?: string
  search?: string
  semesterId?: number
  fanpageId?: number
  eventTypeId?: number
  criteriaId?: number
  category?: EventCategory
  status?: EventStatus
  page?: number
  size?: number
  limit?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

export interface EventResponseDto {
  id: number | string
  name?: string
  title?: string
  description: string
  location: string | EventLocation
  dateOpen?: string
  dateClose?: string
  dateHappen?: string
  startTime?: string
  endTime?: string
  capacity: number
  maleQuantity?: number
  femaleQuantity?: number
  registeredCount?: number
  price?: number
  bannerUrl?: string
  status: EventStatus
  eventTypeName?: string
  category?: string
  criteriaName?: string
  fanpageName?: string
  fanpageId?: number
  organizerId?: string
  organizerName?: string
  organizerAvatarUrl?: string
  isActive?: boolean
  isModerationRequired?: boolean
  semester?: EventSemester | null
  eventPoints?: EventPointReward[]
  pointsReward?: string
  quotaText?: string
  timeAgo?: string
  isFollowed?: boolean
  isSaved?: boolean
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface EventCreateRequestDto {
  name: string
  description: string
  location: string
  dateOpen: string
  dateClose: string
  dateHappen: string
  capacity: number
  maleQuantity?: number
  femaleQuantity?: number
  bannerUrl: string
  eventTypeId: number
  criteriaId: number
  fanpageId: number
  semesterId: number
  eventPoints?: { pointCategoryId: number; point: number }[]
}

export interface EventUpdateRequestDto extends Partial<EventCreateRequestDto> {
  id?: number | string
  status?: EventStatus
}
