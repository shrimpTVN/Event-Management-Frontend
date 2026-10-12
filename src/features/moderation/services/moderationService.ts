import { apiClient } from '@/shared'
import type { PendingApplicant } from '../types/moderation.types'

export const moderationService = {
  /**
   * Fetches queue of applicants awaiting moderation
   */
  async getPendingQueue(): Promise<PendingApplicant[]> {
    return apiClient.get('/moderation/queue')
  },

  /**
   * Approves applicant to next stage or final approval
   */
  async approveApplicant(registrationId: string): Promise<void> {
    return apiClient.post(`/moderation/${registrationId}/approve`)
  },

  /**
   * Rejects applicant registration
   */
  async rejectApplicant(registrationId: string, reason?: string): Promise<void> {
    return apiClient.post(`/moderation/${registrationId}/reject`, { reason })
  },
}
