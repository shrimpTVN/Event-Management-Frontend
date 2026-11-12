import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FanpageNotificationDropdown } from '../FanpageNotificationDropdown'
import * as notificationsModule from '@/features/notifications'

vi.mock('@/features/notifications', async () => {
  const actual = await vi.importActual('@/features/notifications')
  return {
    ...actual,
    useFanpageUnreadNotificationCount: vi.fn(),
    useFanpageNotifications: vi.fn(),
    useFanpageNotificationActions: vi.fn(),
  }
})

describe('FanpageNotificationDropdown', () => {
  const mockMarkAsRead = vi.fn()
  const mockMarkAllAsRead = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationsModule.useFanpageNotificationActions).mockReturnValue({
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: vi.fn(),
      isMarkingAllAsRead: false,
    })
  })

  it('renders nothing when isOpen is false', () => {
    vi.mocked(notificationsModule.useFanpageUnreadNotificationCount).mockReturnValue({
      data: 0,
    } as any)
    vi.mocked(notificationsModule.useFanpageNotifications).mockReturnValue({
      data: { content: [] },
    } as any)

    const { container } = render(
      <MemoryRouter>
        <FanpageNotificationDropdown
          isOpen={false}
          onClose={vi.fn()}
          fanpageId="1"
          fanpageName="CLB Tin Học"
        />
      </MemoryRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders dropdown with fanpage title, tabs, and notifications', () => {
    vi.mocked(notificationsModule.useFanpageUnreadNotificationCount).mockReturnValue({
      data: 2,
    } as any)
    vi.mocked(notificationsModule.useFanpageNotifications).mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            title: 'Đăng ký tham gia',
            message: 'Nguyễn Văn A muốn tham gia fanpage',
            status: 'UNREAD',
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            title: 'Duyệt bài viết',
            message: 'Bài viết sự kiện đã được phê duyệt',
            status: 'READ',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    } as any)

    render(
      <MemoryRouter>
        <FanpageNotificationDropdown
          isOpen={true}
          onClose={vi.fn()}
          fanpageId="1"
          fanpageName="CLB Tin Học"
        />
      </MemoryRouter>
    )

    // Check title
    expect(screen.getByText('Thông báo Fanpage')).toBeDefined()
    // Check tabs
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeDefined()
    expect(screen.getByText('Chưa đọc')).toBeDefined()

    // Check notification content
    expect(screen.getByText('Đăng ký tham gia')).toBeDefined()
    expect(screen.getByText('Duyệt bài viết')).toBeDefined()
  })

  it('calls markAllAsRead when clicking "Đã đọc tất cả"', () => {
    vi.mocked(notificationsModule.useFanpageUnreadNotificationCount).mockReturnValue({
      data: 2,
    } as any)
    vi.mocked(notificationsModule.useFanpageNotifications).mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            title: 'Đăng ký tham gia',
            message: 'Nguyễn Văn A muốn tham gia fanpage',
            status: 'UNREAD',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    } as any)

    render(
      <MemoryRouter>
        <FanpageNotificationDropdown
          isOpen={true}
          onClose={vi.fn()}
          fanpageId="1"
          fanpageName="CLB Tin Học"
        />
      </MemoryRouter>
    )

    const markAllBtn = screen.getByTitle('Đánh dấu tất cả là đã đọc')
    fireEvent.click(markAllBtn)

    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })
})
