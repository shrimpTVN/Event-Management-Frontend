import { apiClient } from '@/shared'
import type {
  FanpageSummary,
  FanpageActivityStats,
  UpcomingEventReminder,
  FanpageFeedPost,
  FanpageInvitation,
} from '../types/fanpageAdmin.types'

export const EMPTY_ACTIVITY_STATS: FanpageActivityStats = {
  periodLabel: '7 ngày gần nhất',
  eventsCount: 0,
  interactionsCount: 0,
  newFollowersCount: 0,
  responseRatePercent: 100,
  pendingCommentsCount: 0,
}

export const fanpageAdminService = {
  /**
   * Retrieves the current primary fanpage for the logged-in staff member
   */
  getCurrentFanpage: async (): Promise<FanpageSummary | null> => {
    const fanpages = await fanpageAdminService.getAvailableFanpages()
    return fanpages.length > 0 ? fanpages[0] : null
  },

  /**
   * Retrieves all managed fanpages of the authenticated fanpage admin
   */
  getAvailableFanpages: async (): Promise<FanpageSummary[]> => {
    try {
      const res: any = await apiClient.get('/fanpages/fanpage-admin/my-fanpages')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((fp: any) => ({
        id: String(fp.id),
        code:
          fp.code ||
          (fp.name?.includes('CNTT')
            ? 'CNTT'
            : fp.name?.includes('Cần Thơ') || fp.name?.includes('CTU')
              ? 'CTU'
              : 'CLB'),
        name: fp.name,
        fullName: fp.orgName || fp.name,
        avatarText: (fp.code || fp.name || 'FP').substring(0, 3).toUpperCase(),
        role: fp.role || 'Quản trị viên',
        isVerified: fp.status === 'ACTIVE',
        email: fp.helpContact || fp.email || '',
        phone: fp.helpPhone || fp.phone || '',
        address: fp.address || 'Khu II, Đại học Cần Thơ',
        followersCount: fp.followersCount || fp.followerCount || 0,
        eventsCount: fp.eventsCount || fp.eventCount || 0,
        description: fp.description || '',
      }))
    } catch {
      return []
    }
  },

  /**
   * Fetches real-time activity statistics for a specific fanpage
   */
  getActivityStats: async (fanpageId?: string | number): Promise<FanpageActivityStats> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/activity-stats`)
      return res || EMPTY_ACTIVITY_STATS
    } catch {
      return EMPTY_ACTIVITY_STATS
    }
  },

  /**
   * Fetches the nearest upcoming event reminder for the dashboard
   */
  getUpcomingReminder: async (fanpageId?: string | number): Promise<UpcomingEventReminder | null> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/upcoming-reminder`)
      return res || null
    } catch {
      return null
    }
  },

  /**
   * Fetches feed of events belonging to a fanpage
   */
  getFeedPosts: async (fanpageId?: string | number): Promise<FanpageFeedPost[]> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/events`)
      const list = res?.content || (Array.isArray(res) ? res : [])
      return list.map((ev: any, idx: number) => ({
        id: `post-${ev.id}`,
        authorName: ev.authorName || ev.fanpageName || 'Ban Tổ Chức',
        authorCode: 'BTC',
        authorAvatarText: 'FP',
        timeAgo: ev.timeAgo || `${idx + 1} ngày trước`,
        isPublic: true,
        title: ev.name || ev.title,
        summary: ev.description || '',
        bannerUrl: ev.bannerUrl || '',
        likesCount: ev.likesCount ?? 0,
        commentsCount: ev.commentsCount ?? 0,
        sharesCount: ev.sharesCount ?? 0,
        isLiked: Boolean(ev.isLiked),
      }))
    } catch {
      return []
    }
  },

  /**
   * Fetches pending invitations for staff to manage fanpages
   */
  getInvitations: async (): Promise<FanpageInvitation[]> => {
    try {
      const res: any = await apiClient.get('/fanpages/fanpage-admin/invitations')
      return Array.isArray(res) ? res : res?.data || []
    } catch {
      return []
    }
  },

  /**
   * Responds to a fanpage invitation (accept or reject)
   */
  respondInvitation: async (id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void> => {
    await apiClient.patch(`/fanpages/fanpage-admin/invitations/${id}`, { status })
  },
}
