export interface FanpageSummary {
  id: string
  code: string
  name: string
  fullName: string
  avatarText: string
  avatarUrl?: string
  role: string
  isVerified: boolean
  email: string
  phone: string
  address: string
  followersCount: number
  eventsCount: number
  description: string
}

export interface FanpageActivityStats {
  periodLabel: string
  eventsCount: number
  interactionsCount: number
  newFollowersCount: number
  responseRatePercent: number
  pendingCommentsCount: number
}

export interface UpcomingEventReminder {
  id: string
  title: string
  monthText: string
  dayText: string
  registrationsCount: number
  dateText: string
}

export interface FanpageFeedPost {
  id: string
  authorName: string
  authorCode: string
  authorAvatarText: string
  timeAgo: string
  isPublic: boolean
  title: string
  summary: string
  bannerUrl?: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked?: boolean
}

export type AdminNavTab = 'overview' | 'events' | 'profile' | 'settings'
