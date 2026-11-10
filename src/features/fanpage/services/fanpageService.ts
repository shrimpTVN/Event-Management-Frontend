import { apiClient } from '@/shared'
import type { FanpageDetail } from '../types/fanpage.types'
import { normalizeEvent, type Event } from '@/features/events'

export const fanpageService = {
  /**
   * Fetches public fanpage details by ID and normalizes fields with live follower stats
   */
  async getFanpageById(id: string): Promise<FanpageDetail> {
    const raw: any = await apiClient.get(`/fanpages/${id}`)
    const fp = raw?.data || raw

    let followerCount = fp.followerCount ?? fp.followersCount ?? 0
    let isFollowing = false

    // Fetch real-time follower count and user follow status
    try {
      const followRes: any = await apiClient.get(`/fanpages/${id}/followers/count`)
      const followData = followRes?.data || followRes
      if (followData) {
        followerCount = typeof followData.followerCount === 'number' ? followData.followerCount : followerCount
        isFollowing = Boolean(followData.isFollowing)
      }
    } catch {
      // Fallback if unauthenticated or endpoint returns error
    }

    let eventCount = fp.eventCount ?? fp.eventsCount ?? 0
    if (!eventCount) {
      try {
        const countRes: any = await apiClient.get(`/events/fanpage/${id}?page=0&size=1`)
        if (typeof countRes?.totalElements === 'number') {
          eventCount = countRes.totalElements
        } else if (typeof countRes?.data?.totalElements === 'number') {
          eventCount = countRes.data.totalElements
        }
      } catch {
        // Fallback
      }
    }

    const fullName =
      fp.orgName ||
      (fp.name?.includes('CNTT') || String(fp.id) === '1'
        ? 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông'
        : fp.name)

    const avatarUrl =
      fp.avatarUrl ||
      (String(fp.id) === '1' || fp.name?.includes('CNTT')
        ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120')

    return {
      id: String(fp.id),
      name: fp.name,
      fullName,
      avatarUrl,
      coverUrl: fp.coverUrl,
      followerCount,
      eventCount,
      email: fp.email ?? fp.helpContact ?? '',
      description: fp.description ?? '',
      isFollowing,
      isVerified: fp.isVerified ?? (fp.status === 'ACTIVE'),
      phone: fp.phone ?? fp.helpPhone ?? '',
      address: fp.address || 'Khu II, Đường 3/2, Q. Ninh Kiều, TP. Cần Thơ',
      orgType: fp.orgType || 'YOUTH_UNION',
      orgName: fullName,
      parentOrg: fp.parentOrg || 'Trường Đại học Cần Thơ',
    }
  },

  /**
   * Fetches list of published events belonging to a fanpage and normalizes to standard Event model
   */
  async getEventsByFanpage(id: string): Promise<Event[]> {
    try {
      const res: any = await apiClient.get(`/events/fanpage/${id}?size=100`)
      const items = res?.content || res?.data?.content || res?.data || (Array.isArray(res) ? res : [])
      return items.map(normalizeEvent)
    } catch {
      try {
        const resFallback: any = await apiClient.get(`/events?fanpageId=${id}&size=100`)
        const itemsFallback = resFallback?.content || resFallback?.data?.content || resFallback?.data || (Array.isArray(resFallback) ? resFallback : [])
        return itemsFallback.map(normalizeEvent)
      } catch {
        return []
      }
    }
  },

  /**
   * Follows a fanpage
   */
  async followFanpage(id: string): Promise<void> {
    await apiClient.post(`/fanpages/${id}/follow`)
  },

  /**
   * Unfollows a fanpage
   */
  async unfollowFanpage(id: string): Promise<void> {
    await apiClient.delete(`/fanpages/${id}/follow`)
  },

  /**
   * Fetches real fanpage member invitations for the current logged in student/user
   */
  async getMyInvitations(): Promise<any[]> {
    try {
      const res: any = await apiClient.get('/fanpage-member-invitations/me')
      return Array.isArray(res) ? res : res?.data || []
    } catch {
      return []
    }
  },

  /**
   * Accepts a fanpage member invitation
   */
  async acceptInvitation(invitationId: number | string): Promise<void> {
    await apiClient.post(`/fanpage-member-invitations/${invitationId}/accept`)
  },

  /**
   * Declines a fanpage member invitation
   */
  async declineInvitation(invitationId: number | string): Promise<void> {
    await apiClient.post(`/fanpage-member-invitations/${invitationId}/decline`)
  },
}
