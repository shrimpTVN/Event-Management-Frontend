import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/api.types'

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
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenGetter()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
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
      unauthorizedHandler()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }
    return Promise.reject(error)
  }
)
