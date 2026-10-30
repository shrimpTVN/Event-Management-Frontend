import { apiClient } from '@/shared'
import type { FanpageDetail } from '../types/fanpage.types'
import { normalizeEvent, type Event } from '@/features/events'

export const fanpageService = {
  /**
   * Fetches public fanpage details by ID and normalizes fields
   */
  async getFanpageById(id: string): Promise<FanpageDetail> {
    const raw: any = await apiClient.get(`/fanpages/${id}`)
    const fp = raw?.data || raw
    return {
      id: String(fp.id),
      name: fp.name,
      avatarUrl: fp.avatarUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120',
      coverUrl: fp.coverUrl,
      followerCount: fp.followerCount ?? fp.followersCount ?? 0,
      eventCount: fp.eventCount ?? fp.eventsCount ?? 0,
      email: fp.email ?? fp.helpContact ?? '',
      description: fp.description ?? '',
      isFollowing: fp.isFollowing ?? true,
      isVerified: fp.isVerified ?? (fp.status === 'ACTIVE'),
      phone: fp.phone ?? fp.helpPhone ?? '',
      address: fp.address || 'Khu II, Đường 3/2, Q. Ninh Kiều, TP. Cần Thơ',
      orgType: fp.orgType || 'YOUTH_UNION',
      orgName: fp.orgName || fp.name,
      parentOrg: fp.parentOrg || 'Trường Đại học Cần Thơ',
    }
  },

  /**
   * Fetches list of published events belonging to a fanpage and normalizes to standard Event model
   */
  async getEventsByFanpage(id: string): Promise<Event[]> {
    const res: any = await apiClient.get(`/fanpages/${id}/events`)
    const items = res?.content || res?.data || (Array.isArray(res) ? res : [])
    return items.map(normalizeEvent)
  },
}
