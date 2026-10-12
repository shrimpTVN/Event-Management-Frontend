import { apiClient, type PaginatedResponse } from '@/shared'
import type { Event, EventFilters } from '../types/event.types'

export const eventService = {
  /**
   * Fetches paginated event list with optional category, search, and status filters
   */
  async getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    return apiClient.get('/events', { params: filters })
  },

  /**
   * Fetches single event details by ID
   */
  async getEventById(id: string): Promise<Event> {
    return apiClient.get(`/events/${id}`)
  },

  /**
   * Creates a new event (organizer role required)
   */
  async createEvent(payload: Partial<Event>): Promise<Event> {
    return apiClient.post('/events', payload)
  },

  /**
   * Updates an existing event
   */
  async updateEvent(id: string, payload: Partial<Event>): Promise<Event> {
    return apiClient.put(`/events/${id}`, payload)
  },

  /**
   * Deletes an event by ID
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(`/events/${id}`)
  },
}
