import { apiClient } from '@/shared'
import type { Registration, RegistrationFormData } from '../types/registration.types'

export const registrationService = {
  /**
   * Registers attendee for an event using canonical endpoint or alias
   */
  async registerForEvent(eventId: string, data?: Partial<RegistrationFormData>): Promise<any> {
    try {
      return await apiClient.post(`/registrations/me/events/${eventId}`, data)
    } catch {
      // Fallback for prototype endpoint
      return await apiClient.post(`/events/${eventId}/register`, data)
    }
  },

  /**
   * Gets registration details by ID
   */
  async getRegistration(id: string): Promise<Registration> {
    return apiClient.get(`/registrations/${id}`)
  },
}
