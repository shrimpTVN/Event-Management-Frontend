import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { authService } from '../authService'

vi.mock('@/shared', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('authService login response contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MODE', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects a successful backend response missing the authenticated identity', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ role: 'ROLE_STUDENT', roles: ['ROLE_STUDENT'] })

    await expect(authService.login({ email: 'student@student.ctu.edu.vn', password: 'secret123' }))
      .rejects.toThrow('Invalid authentication response from backend')
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('rejects a mock Google credential before sending it to the real backend', async () => {
    await expect(authService.exchangeGoogleToken({ idToken: 'mock-google-token-123' }))
      .rejects.toThrow('Google credential is unavailable')
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})
