export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

export interface NotificationItem {
  id: number | string
  title: string
  message: string
  status: NotificationStatus
  iconUrl?: string | null
  url?: string | null
  fanpageId?: number | null
  createdAt: string
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface NotificationPageResponse {
  content: NotificationItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  last: boolean
  first: boolean
  empty: boolean
}
