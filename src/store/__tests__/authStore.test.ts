import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import { RoleEnum, type User } from '../../types/auth'

const mockUser: User = {
  id: 'usr-123',
  email: 'student@example.com',
  name: 'Alex Student',
  role: RoleEnum.STUDENT,
  createdAt: '2026-10-01T00:00:00.000Z',
}

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('initializes with unauthenticated empty state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('updates state and localStorage upon setAuth', () => {
    const token = 'sample-jwt-token'
    useAuthStore.getState().setAuth(mockUser, token)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
    expect(state.token).toBe(token)

    expect(localStorage.getItem('event_mgmt_access_token')).toBe(token)
    expect(JSON.parse(localStorage.getItem('event_mgmt_user') || '{}')).toEqual(mockUser)
  })

  it('clears state and localStorage upon clearAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'sample-jwt-token')
    useAuthStore.getState().clearAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(localStorage.getItem('event_mgmt_access_token')).toBeNull()
    expect(localStorage.getItem('event_mgmt_user')).toBeNull()
  })

  it('updates partial user profile upon updateUser', () => {
    useAuthStore.getState().setAuth(mockUser, 'sample-jwt-token')
    useAuthStore.getState().updateUser({ name: 'Alex Updated' })

    const state = useAuthStore.getState()
    expect(state.user?.name).toBe('Alex Updated')
    expect(state.user?.email).toBe('student@example.com')
  })
})
