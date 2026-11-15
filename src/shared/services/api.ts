import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/api.types'
import { isMockMode } from '../utils/env'

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

// Request Interceptor: attach Bearer token only if valid for current mode
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenGetter()
    const mock = isMockMode()
    // Do not attach fake mock tokens when connecting to real backend (uses Cookie session)
    if (token && config.headers) {
      if (mock || (!token.startsWith('mock-') && token.trim().length > 0)) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response Interceptor: unwrap envelope & handle 401
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<unknown>).data as any
    }
    return response.data
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const errData = error.response?.data as any
      const exceptionCode = errData?.exceptionCode
      const errMsg = (errData?.message || '').toLowerCase()

      // Backend returns 401 (instead of 403) for domain authorization/permission errors
      // such as AUTH.007 ("You are not admin of the fanpage"), AUTH.003 ("Access denied"),
      // or fanpage/club member permission restrictions.
      // Do NOT log out or redirect to /login for resource permission issues!
      const isPermissionDenied =
        exceptionCode === 'AUTH.007' ||
        exceptionCode === 'AUTH.003' ||
        exceptionCode === 'AUTH.006' ||
        errMsg.includes('not admin') ||
        errMsg.includes('not an admin') ||
        errMsg.includes('permission') ||
        errMsg.includes('access denied')

      if (!isPermissionDenied) {
        unauthorizedHandler()
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        }
      }
    }
    return Promise.reject(error)
  }
)
