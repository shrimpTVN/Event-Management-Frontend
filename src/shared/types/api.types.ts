export interface ApiResponse<T> {
  success?: boolean
  message?: string
  data: T
  exceptionCode?: string | null
}

/**
 * Error envelope returned by GlobalExceptionHandler (BaseResponse)
 * and compact security responses ({ exceptionCode, message }).
 */
export interface ApiErrorResponse {
  data?: Record<string, string> | null
  message: string
  exceptionCode?: string | null
  // Legacy aliases kept optional during transition
  success?: false
  code?: string
  errors?: Record<string, string | string[]>
  fieldErrors?: Record<string, string>
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}
