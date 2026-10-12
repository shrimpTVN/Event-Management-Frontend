import { apiClient } from '@/shared'
import type { Registration, RegistrationFormData } from '../types/registration.types'

export const registrationService = {
  /**
   * Registers attendee for an event
   */
  async registerForEvent(eventId: string, data: RegistrationFormData): Promise<Registration> {
    return apiClient.post(`/events/${eventId}/register`, data)
  },

  /**
   * Gets registration details by ID
   */
  async getRegistration(id: string): Promise<Registration> {
    return apiClient.get(`/registrations/${id}`)
  },
}
