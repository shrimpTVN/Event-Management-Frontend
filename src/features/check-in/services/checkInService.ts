import { apiClient } from '@/shared'
import type { CheckInPayload, CheckInResult } from '../types/checkIn.types'

export const checkInService = {
  /**
   * Uploads attendee verification photo for self check-in
   */
  async verifyPhotoCheckIn(payload: CheckInPayload): Promise<CheckInResult> {
    const formData = new FormData()
    formData.append('registrationId', payload.registrationId)
    formData.append('photo', payload.photo)

    return apiClient.post('/checkin/photo-verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
