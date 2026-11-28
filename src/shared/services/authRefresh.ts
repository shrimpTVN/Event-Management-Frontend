import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isMockMode } from '../utils/env'

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _authGeneration?: number
}

const AUTH_SKIP_PATHS = [
  '/auth/login',
  '/auth/login/google',
  '/auth/register',
  '/auth/register/fanpage-admin',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/refresh-token',
  '/auth/logout',
]

export const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<void> | null = null
let isLoggingOut = false
let authGeneration = 0
let isRedirectingToLogin = false
let authStatusGetter: () => boolean = () => true

export function setAuthStatusGetter(getter: () => boolean): void {
  authStatusGetter = getter
}

export function hasActiveSession(): boolean {
  return authStatusGetter()
}

export function getAuthGeneration(): number {
  return authGeneration
}

export function markSessionAuthenticated(): void {
  authGeneration += 1
  isLoggingOut = false
  isRedirectingToLogin = false
}

export function beginLogoutTransition(): void {
  authGeneration += 1
  isLoggingOut = true
}

export function endLogoutTransition(): void {
  isLoggingOut = false
}

export function isSessionLoggingOut(): boolean {
  return isLoggingOut
}

export function isCredentialOrPublicAuthPath(url?: string): boolean {
  if (typeof url !== 'string' || !url) return false
  const cleanUrl = url.split('?')[0]
  return AUTH_SKIP_PATHS.some((path) => cleanUrl === path || cleanUrl.endsWith(path))
}

export function shouldAttemptTokenRefresh(
  error: AxiosError,
  config?: RetryableRequestConfig
): boolean {
  if (error.response?.status !== 401 || isMockMode() || !config) {
    return false
  }
  if (config._retry || config.signal?.aborted) {
    return false
  }
  if (isLoggingOut || (config._authGeneration !== undefined && config._authGeneration !== authGeneration)) {
    return false
  }
  if (isCredentialOrPublicAuthPath(config.url)) {
    return false
  }
  const exceptionCode = (error.response?.data as { exceptionCode?: string } | undefined)?.exceptionCode
  if (exceptionCode === 'AUTH.001' || exceptionCode === 'AUTH.010') {
    return false
  }
  return true
}

export function runSingleFlightRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh-token')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export function isTerminalRefreshError(error: unknown): boolean {
  const err = error as AxiosError | null | undefined
  const status = err?.response?.status
  return status === 400 || status === 401
}

export function redirectToLoginOnce(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname.startsWith('/login') || isRedirectingToLogin) {
    return
  }
  isRedirectingToLogin = true
  setTimeout(() => {
    isRedirectingToLogin = false
  }, 1000)
  const fullTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.href = `/login?redirect=${encodeURIComponent(fullTarget)}`
}
