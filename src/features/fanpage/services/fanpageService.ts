import { apiClient } from '@/shared'
import type { FanpageDetail, FanpagePublicEventPost } from '../types/fanpage.types'

export const fanpageService = {
  /**
   * Fetches public fanpage details by ID
   */
  async getFanpageById(id: string): Promise<FanpageDetail> {
    return apiClient.get(`/fanpages/${id}`)
  },

  /**
   * Fetches list of published events belonging to a fanpage
   */
  async getEventsByFanpage(id: string): Promise<FanpagePublicEventPost[]> {
    const res: any = await apiClient.get(`/fanpages/${id}/events`)
    if (res && Array.isArray(res.content)) {
      return res.content
    }
    if (Array.isArray(res)) {
      return res
    }
    if (res && Array.isArray(res.items)) {
      return res.items
    }
    return []
  },
}
