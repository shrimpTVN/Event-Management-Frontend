import { create } from 'zustand'
import { setAuthTokenGetter, setOnUnauthorized } from '@/shared/services/api'
import type { User } from '../types/auth.types'

interface AuthStoreState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

const STORAGE_KEY_TOKEN = 'event_mgmt_access_token'
const STORAGE_KEY_USER = 'event_mgmt_user'

function getInitialToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY_TOKEN)
}

function getInitialUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialToken = getInitialToken()
const initialUser = getInitialUser()

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),

  setAuth: (user: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TOKEN, token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    }
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      localStorage.removeItem(STORAGE_KEY_USER)
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },

  updateUser: (updatedFields: Partial<User>) => {
    set((state) => {
      if (!state.user) return state
      const newUser = { ...state.user, ...updatedFields }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser))
      }
      return { user: newUser }
    })
  },
}))

// Connect token and 401 callbacks to shared API client
setAuthTokenGetter(() => useAuthStore.getState().token)
setOnUnauthorized(() => useAuthStore.getState().clearAuth())
