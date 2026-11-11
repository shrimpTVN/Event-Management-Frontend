import { apiClient } from '@/shared/services/api'
import type {
  NotificationPageResponse,
  NotificationStatus,
} from '../types/notification.types'

export const notificationService = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại (hỗ trợ phân trang và lọc)
   */
  async getMyNotifications(
    page = 0,
    size = 20,
    status?: NotificationStatus
  ): Promise<NotificationPageResponse> {
    const params: Record<string, any> = {
      page,
      size,
      sortBy: 'createdAt',
      sortDir: 'desc',
    }
    if (status) {
      params.status = status
    }

    const res: any = await apiClient.get('/notifications', { params })
    // If backend returns Page object directly or wrapped in data
    if (res && Array.isArray(res.content)) {
      return res as NotificationPageResponse
    }
    if (Array.isArray(res)) {
      return {
        content: res,
        totalElements: res.length,
        totalPages: 1,
        size: res.length,
        number: 0,
        last: true,
        first: true,
        empty: res.length === 0,
      }
    }
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size,
      number: page,
      last: true,
      first: true,
      empty: true,
    }
  },

  /**
   * Đếm số lượng thông báo chưa đọc của người dùng
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res: any = await apiClient.get('/notifications/unread-count')
      if (typeof res?.unreadCount === 'number') {
        return res.unreadCount
      }
      if (typeof res === 'number') {
        return res
      }
      return 0
    } catch {
      return 0
    }
  },

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markAsRead(id: number | string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },

  /**
   * Xóa 1 thông báo
   */
  async deleteNotification(id: number | string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`)
  },

  /**
   * Lấy thông báo gửi tới Fanpage (dành cho Admin Fanpage)
   */
  async getFanpageNotifications(
    fanpageId: number | string,
    page = 0,
    size = 20,
    status?: NotificationStatus
  ): Promise<NotificationPageResponse> {
    const params: Record<string, any> = {
      page,
      size,
      sortBy: 'createdAt',
      sortDir: 'desc',
    }
    if (status) {
      params.status = status
    }

    const res: any = await apiClient.get(`/notifications/fanpages/${fanpageId}`, { params })
    if (res && Array.isArray(res.content)) {
      return res as NotificationPageResponse
    }
    return {
      content: Array.isArray(res) ? res : [],
      totalElements: Array.isArray(res) ? res.length : 0,
      totalPages: 1,
      size,
      number: page,
      last: true,
      first: true,
      empty: !Array.isArray(res) || res.length === 0,
    }
  },

  /**
   * Đếm số thông báo chưa đọc của Fanpage
   */
  async getFanpageUnreadCount(fanpageId: number | string): Promise<number> {
    try {
      const res: any = await apiClient.get(`/notifications/fanpages/${fanpageId}/unread-count`)
      return typeof res?.unreadCount === 'number' ? res.unreadCount : 0
    } catch {
      return 0
    }
  },

  /**
   * Đánh dấu đã đọc cho thông báo của Fanpage
   */
  async markAsReadByFanpage(id: number | string, fanpageId: number | string): Promise<void> {
    await apiClient.patch(`/notifications/fanpages/${fanpageId}/${id}/read`)
  },

  /**
   * Đánh dấu tất cả đã đọc cho Fanpage
   */
  async markAllAsReadByFanpage(fanpageId: number | string): Promise<void> {
    await apiClient.patch(`/notifications/fanpages/${fanpageId}/read-all`)
  },

  /**
   * Xóa thông báo của Fanpage
   */
  async deleteFanpageNotification(id: number | string, fanpageId: number | string): Promise<void> {
    await apiClient.delete(`/notifications/fanpages/${fanpageId}/${id}`)
  },
}
