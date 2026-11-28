import axios, { type AxiosError, type AxiosInstance } from 'axios'
import type { ApiResponse } from '../types/api.types'
import { isMockMode } from '../utils/env'
import {
  getAuthGeneration,
  hasActiveSession,
  isCredentialOrPublicAuthPath,
  isSessionLoggingOut,
  isTerminalRefreshError,
  redirectToLoginOnce,
  runSingleFlightRefresh,
  shouldAttemptTokenRefresh,
  type RetryableRequestConfig,
} from './authRefresh'

let tokenGetter: () => string | null = () => null
let unauthorizedHandler: () => void = () => {}

/**
 * Injects token getter function from auth feature to avoid circular dependencies
 */
export function setAuthTokenGetter(getter: () => string | null) {
  tokenGetter = getter
}

/**
 * Injects 401 callback handler from auth feature
 */
export function setOnUnauthorized(handler: () => void) {
  unauthorizedHandler = handler
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function stripBearerHeader(config: RetryableRequestConfig): void {
  if (!config.headers) return
  if (typeof config.headers.delete === 'function') {
    config.headers.delete('Authorization')
  } else {
    delete (config.headers as Record<string, unknown>).Authorization
  }
}

// Request Interceptor: only attach Bearer token in mock mode; real BE relies solely on HttpOnly cookies
apiClient.interceptors.request.use(
  (config: RetryableRequestConfig) => {
    config._authGeneration = getAuthGeneration()
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else {
        delete (config.headers as Record<string, unknown>)['Content-Type']
      }
    }
    if (isMockMode()) {
      const token = tokenGetter()
      if (token && config.headers) {
        const isGoogleIdToken = token.startsWith('eyJhbGciOiJSUzI1Ni')
        if (!isGoogleIdToken && token.trim().length > 0) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } else if (!config._retry) {
      stripBearerHeader(config)
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: unwrap envelope & handle 401 refresh + retry once
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<unknown>).data as any
    }
    return response.data
  },
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined

    if (error.response?.status === 401 && originalConfig) {
      const exceptionCode = (error.response?.data as { exceptionCode?: string } | undefined)
        ?.exceptionCode
      const isPublicAuth = isCredentialOrPublicAuthPath(originalConfig.url)
      const isNonSessionAuthCode = exceptionCode === 'AUTH.001' || exceptionCode === 'AUTH.010'

      if (shouldAttemptTokenRefresh(error, originalConfig)) {
        const startGeneration = getAuthGeneration()
        const hadSession = hasActiveSession()
        try {
          await runSingleFlightRefresh()
        } catch (refreshError) {
          if (isTerminalRefreshError(refreshError) && !isSessionLoggingOut()) {
            unauthorizedHandler()
            if (hadSession) {
              redirectToLoginOnce()
            }
          }
          return Promise.reject(isTerminalRefreshError(refreshError) ? error : refreshError)
        }

        // If user logged out or switched session while refresh was in flight, abort retry cleanly.
        if (
          isSessionLoggingOut() ||
          startGeneration !== getAuthGeneration() ||
          originalConfig.signal?.aborted
        ) {
          return Promise.reject(error)
        }

        originalConfig._retry = true
        originalConfig._authGeneration = getAuthGeneration()
        stripBearerHeader(originalConfig)
        return apiClient(originalConfig)
      }

      // Retry after refresh failed with 401 (stop, do not refresh twice) or non-refreshable protected 401
      if (
        !isPublicAuth &&
        !isNonSessionAuthCode &&
        !isSessionLoggingOut() &&
        !originalConfig.signal?.aborted &&
        (originalConfig._authGeneration === undefined ||
          originalConfig._authGeneration === getAuthGeneration())
      ) {
        const hadSession = hasActiveSession()
        unauthorizedHandler()
        if (hadSession) {
          redirectToLoginOnce()
        }
      }
    }

    return Promise.reject(error)
  }
)
