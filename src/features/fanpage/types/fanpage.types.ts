export interface FanpageDetail {
  id: string
  name: string
  avatarUrl: string
  coverUrl?: string
  followerCount: number
  eventCount: number
  email: string
  description: string
  isFollowing: boolean
  isVerified?: boolean
  phone?: string
  address?: string
  orgType?: string
  orgName?: string
  parentOrg?: string
}

export interface FanpagePublicEventPost {
  id: string
  eventId: string
  authorName: string
  authorAvatarUrl: string
  timeAgo: string
  isFollowingAuthor?: boolean
  title: string
  description: string
  bannerUrl: string
  dateHappen: string // e.g. "18/10/2026 · 16:00–18:00"
  location: string // e.g. "Hội trường Rùa – Đại học Cần Thơ"
  benefits: string // e.g. "Cộng 03 điểm rèn luyện mục V.b"
  capacityText: string // e.g. "700 sinh viên"
  commentsCount: number
  sharesCount?: number
  isSaved?: boolean
  canRegister?: boolean
}
