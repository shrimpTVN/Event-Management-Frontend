import { normalizeNotification } from '../notificationPath'
import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  hasActiveSession,
  isSessionLoggingOut,
  isTerminalRefreshError,
  redirectToLoginOnce,
  runSingleFlightRefresh,
} from '@/shared/services/authRefresh'
import { isMockMode } from '@/shared/utils/env'
import { notificationService } from '../services/notificationService'
import type { NotificationItem, NotificationStatus } from '../types/notification.types'

const SSE_RECONNECT_DELAYS_MS = [2000, 5000, 15000, 30000]

/**
 * Hook lắng nghe kết nối Server-Sent Events (SSE) thời gian thực
 */
export function useNotificationStream(
  onNotificationReceived?: (notification: NotificationItem) => void
) {
  const queryClient = useQueryClient()
  const { user, token, clearAuth } = useAuthStore()
  const userId = user?.id
  const userEmail = user?.email
  const onReceivedRef = useRef(onNotificationReceived)

  useEffect(() => {
    onReceivedRef.current = onNotificationReceived
  }, [onNotificationReceived])

  useEffect(() => {
    if (!userId && !userEmail) return
    if (isMockMode() || typeof EventSource === 'undefined') return

    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false
    let retryAttempt = 0
    let isRecovering = false

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const closeSource = () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return
      const delay =
        SSE_RECONNECT_DELAYS_MS[Math.min(retryAttempt, SSE_RECONNECT_DELAYS_MS.length - 1)]
      retryAttempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (disposed || isSessionLoggingOut()) return
      closeSource()

      try {
        const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
        const streamBase = `${apiBase}/notifications/stream`
        const url = token ? `${streamBase}?token=${encodeURIComponent(token)}` : streamBase

        eventSource = new EventSource(url, { withCredentials: true })

        eventSource.onopen = () => {
          retryAttempt = 0
        }

        eventSource.addEventListener('NOTIFICATION', (event: MessageEvent) => {
          retryAttempt = 0
          try {
            const data = normalizeNotification(JSON.parse(event.data))
            // Invalidate queries để đồng bộ danh sách và số lượng chưa đọc ngay lập tức
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
            queryClient.invalidateQueries({ queryKey: ['fanpage-notifications'] })
            queryClient.invalidateQueries({ queryKey: ['fanpage-notifications-unread-count'] })
            onReceivedRef.current?.(data)
          } catch (err) {
            console.error('Lỗi khi phân tích dữ liệu SSE notification:', err)
          }
        })

        eventSource.onerror = async () => {
          closeSource()
          if (disposed || isRecovering || isSessionLoggingOut() || !hasActiveSession()) {
            return
          }
          isRecovering = true
          try {
            await runSingleFlightRefresh()
            if (!disposed && !isSessionLoggingOut() && hasActiveSession()) {
              scheduleReconnect()
            }
          } catch (refreshError) {
            if (isTerminalRefreshError(refreshError) && !isSessionLoggingOut()) {
              clearAuth()
              redirectToLoginOnce()
              return
            }
            if (!disposed) {
              scheduleReconnect()
            }
          } finally {
            isRecovering = false
          }
        }
      } catch (err) {
        console.error('Không thể khởi tạo kết nối SSE notification:', err)
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      disposed = true
      clearReconnectTimer()
      closeSource()
    }
  }, [userId, userEmail, token, queryClient, clearAuth])
}

/**
 * Hook lấy danh sách thông báo của người dùng
 */
export function useNotifications(page = 0, size = 20, status?: NotificationStatus) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['notifications', user?.id, page, size, status],
    queryFn: () => notificationService.getMyNotifications(page, size, status),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook lấy số lượng thông báo chưa đọc của người dùng
 */
export function useUnreadNotificationCount() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Định kỳ refetch mỗi 60s làm dự phòng nếu mất kết nối SSE
  })
}

/**
 * Hook các thao tác thông báo (đánh dấu đã đọc, xóa)
 */
export function useNotificationActions() {
  const queryClient = useQueryClient()

  const markAsReadMutation = useMutation({
    mutationFn: (id: number | string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number | string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  return {
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

/**
 * Hook lấy danh sách thông báo của Fanpage (dành cho Admin / Workspace)
 */
export function useFanpageNotifications(
  fanpageId?: number | string,
  page = 0,
  size = 20,
  status?: NotificationStatus
) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['fanpage-notifications', fanpageId, page, size, status],
    queryFn: () => notificationService.getFanpageNotifications(fanpageId!, page, size, status),
    enabled: Boolean(fanpageId) && Boolean(user),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook lấy số lượng thông báo chưa đọc của Fanpage (chỉ gọi khi có quyền quản trị)
 */
export function useFanpageUnreadNotificationCount(
  fanpageId?: number | string,
  enabled: boolean = true
) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['fanpage-notifications-unread-count', fanpageId],
    queryFn: () => notificationService.getFanpageUnreadCount(fanpageId!),
    enabled: Boolean(fanpageId) && Boolean(user) && enabled,
    staleTime: 30 * 1000,
    refetchInterval: Boolean(user) && enabled ? 60 * 1000 : false,
  })
}

/**
 * Hook các thao tác thông báo của Fanpage (đánh dấu đã đọc, xóa)
 */
export function useFanpageNotificationActions(fanpageId?: number | string) {
  const queryClient = useQueryClient()

  const markAsReadMutation = useMutation({
    mutationFn: (id: number | string) => {
      if (!fanpageId) throw new Error('fanpageId is required')
      return notificationService.markAsReadByFanpage(id, fanpageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications', fanpageId] })
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications-unread-count', fanpageId] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!fanpageId) throw new Error('fanpageId is required')
      return notificationService.markAllAsReadByFanpage(fanpageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications', fanpageId] })
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications-unread-count', fanpageId] })
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number | string) => {
      if (!fanpageId) throw new Error('fanpageId is required')
      return notificationService.deleteFanpageNotification(id, fanpageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications', fanpageId] })
      queryClient.invalidateQueries({ queryKey: ['fanpage-notifications-unread-count', fanpageId] })
    },
  })

  return {
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}
