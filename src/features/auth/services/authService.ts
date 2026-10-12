import { apiClient } from '@/shared/services/api'
import type { AuthResponse, GoogleAuthPayload, User } from '../types/auth.types'

export const authService = {
  /**
   * Exchanges Google OAuth credential token with backend
   */
  async exchangeGoogleToken(payload: GoogleAuthPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/google', payload)
  },

  /**
   * Retrieves current authenticated user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get('/auth/me')
  },

  /**
   * Logs out user and invalidates session token on backend
   */
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout')
  },
}
