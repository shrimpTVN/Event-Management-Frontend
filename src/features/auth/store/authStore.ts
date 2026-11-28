import { create } from 'zustand'
import { setAuthTokenGetter, setOnUnauthorized } from '@/shared/services/api'
import {
  markSessionAuthenticated,
  setAuthStatusGetter,
} from '@/shared/services/authRefresh'
import { isMockMode } from '@/shared/utils/env'
import type { User } from '../types/auth.types'

interface AuthStoreState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token?: string | null) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

const STORAGE_KEY_TOKEN = 'event_mgmt_access_token'
const STORAGE_KEY_USER = 'event_mgmt_user'

function shouldUseStoredBearerToken(): boolean {
  return isMockMode() || import.meta.env.MODE === 'test'
}

function getInitialToken(): string | null {
  if (typeof window === 'undefined') return null
  if (!shouldUseStoredBearerToken()) {
    // Real backend relies exclusively on HttpOnly cookies; purge stale Bearer tokens.
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    return null
  }
  const stored = localStorage.getItem(STORAGE_KEY_TOKEN)
  // Google ID tokens (RS256) are for auth verification only, not backend session tokens
  if (stored && stored.startsWith('eyJhbGciOiJSUzI1Ni')) {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    return null
  }
  return stored
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
  isAuthenticated: Boolean(initialUser),

  setAuth: (user: User, token?: string | null) => {
    markSessionAuthenticated()
    // Real backend authenticates via HttpOnly cookies; keep Bearer storage for mock/test mode only.
    const validToken =
      shouldUseStoredBearerToken() && token && !token.startsWith('eyJhbGciOiJSUzI1Ni') ? token : null
    if (typeof window !== 'undefined') {
      if (validToken) {
        localStorage.setItem(STORAGE_KEY_TOKEN, validToken)
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    }
    set({
      user,
      token: validToken,
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

// Connect token, auth status, and 401 callbacks to shared API client
setAuthTokenGetter(() => useAuthStore.getState().token)
setAuthStatusGetter(() => useAuthStore.getState().isAuthenticated)
setOnUnauthorized(() => useAuthStore.getState().clearAuth())
