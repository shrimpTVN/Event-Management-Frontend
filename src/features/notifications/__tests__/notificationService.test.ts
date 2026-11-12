import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '../services/notificationService'
import { apiClient } from '@/shared/services/api'

vi.mock('@/shared/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches user notifications with pagination', async () => {
    const mockResponse = {
      content: [
        {
          id: 1,
          title: 'Event Completed & Points Awarded',
          message: 'Your points have been awarded',
          status: 'UNREAD',
          createdAt: '2026-11-11T08:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

    const result = await notificationService.getMyNotifications(0, 20)

    expect(apiClient.get).toHaveBeenCalledWith('/notifications', {
      params: { page: 0, size: 20, sortBy: 'createdAt', sortDir: 'desc' },
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].title).toBe('Event Completed & Points Awarded')
  })

  it('fetches unread notification count', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ unreadCount: 5 })

    const count = await notificationService.getUnreadCount()

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count')
    expect(count).toBe(5)
  })

  it('marks a notification as read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({})

    await notificationService.markAsRead(42)

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/42/read')
  })

  it('marks all notifications as read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({})

    await notificationService.markAllAsRead()

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('deletes a notification', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await notificationService.deleteNotification(10)

    expect(apiClient.delete).toHaveBeenCalledWith('/notifications/10')
  })

  it('fetches fanpage notifications with pagination and status', async () => {
    const mockResponse = {
      content: [
        {
          id: 101,
          title: 'Đơn đăng ký mới',
          message: 'Có đơn tham gia ban tổ chức',
          status: 'UNREAD',
          createdAt: '2026-11-12T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

    const result = await notificationService.getFanpageNotifications('fp-1', 0, 10, 'UNREAD')

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/fanpages/fp-1', {
      params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc', status: 'UNREAD' },
    })
    expect(result.content).toHaveLength(1)
  })

  it('fetches fanpage unread notification count', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ unreadCount: 3 })

    const count = await notificationService.getFanpageUnreadCount('fp-1')

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/fanpages/fp-1/unread-count')
    expect(count).toBe(3)
  })

  it('marks a fanpage notification as read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({})

    await notificationService.markAsReadByFanpage(99, 'fp-1')

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/fanpages/fp-1/99/read')
  })

  it('marks all fanpage notifications as read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({})

    await notificationService.markAllAsReadByFanpage('fp-1')

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/fanpages/fp-1/read-all')
  })

  it('deletes a fanpage notification', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await notificationService.deleteFanpageNotification(99, 'fp-1')

    expect(apiClient.delete).toHaveBeenCalledWith('/notifications/fanpages/fp-1/99')
  })
})

