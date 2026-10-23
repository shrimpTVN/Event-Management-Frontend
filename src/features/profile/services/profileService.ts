import { apiClient } from '@/shared'
import type { StudentProfile } from '../types/profile.types'

export const profileService = {
  /**
   * Fetches current authenticated student profile
   */
  async getMyProfile(): Promise<StudentProfile> {
    return apiClient.get('/users/me/profile')
  },

  /**
   * Updates student profile information
   */
  async updateMyProfile(payload: Partial<StudentProfile>): Promise<StudentProfile> {
    return apiClient.put('/users/me/profile', payload)
  },
}
