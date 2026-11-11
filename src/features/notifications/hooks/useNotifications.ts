import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { notificationService } from '../services/notificationService'
import type { NotificationItem, NotificationStatus } from '../types/notification.types'

/**
 * Hook lắng nghe kết nối Server-Sent Events (SSE) thời gian thực
 */
export function useNotificationStream(onNotificationReceived?: (notification: NotificationItem) => void) {
  const queryClient = useQueryClient()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!user) return

    let eventSource: EventSource | null = null

    try {
      // Endpoint SSE backend
      const baseUrl = '/api/notifications/stream'
      const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl

      eventSource = new EventSource(url, { withCredentials: true })

      eventSource.addEventListener('NOTIFICATION', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          // Invalidate queries để đồng bộ danh sách và số lượng chưa đọc ngay lập tức
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
          onNotificationReceived?.(data)
        } catch (err) {
          console.error('Lỗi khi phân tích dữ liệu SSE notification:', err)
        }
      })

      eventSource.onerror = () => {
        // Trình duyệt tự động thử kết nối lại
      }
    } catch (err) {
      console.error('Không thể khởi tạo kết nối SSE notification:', err)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [user, token, queryClient, onNotificationReceived])
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
