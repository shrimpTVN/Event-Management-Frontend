import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FanpageNotificationDropdown } from '../FanpageNotificationDropdown'
import { notificationService } from '@/features/notifications'

vi.mock('@/features/notifications', async () => {
  const actual = await vi.importActual('@/features/notifications')
  return {
    ...actual,
    notificationService: {
      getFanpageNotifications: vi.fn(),
      getFanpageUnreadCount: vi.fn(),
      markAsReadByFanpage: vi.fn(),
      markAllAsReadByFanpage: vi.fn(),
      deleteFanpageNotification: vi.fn(),
    },
  }
})

describe('FanpageNotificationDropdown', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FanpageNotificationDropdown
            isOpen={false}
            onClose={vi.fn()}
            fanpageId="1"
            fanpageName="CLB Tin Học"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders dropdown with fanpage title, tabs, and notifications', async () => {
    vi.mocked(notificationService.getFanpageUnreadCount).mockResolvedValue(2)
    vi.mocked(notificationService.getFanpageNotifications).mockResolvedValue({
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
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0,
      last: true,
      first: true,
      empty: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FanpageNotificationDropdown
            isOpen={true}
            onClose={vi.fn()}
            fanpageId="1"
            fanpageName="CLB Tin Học"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Check title
    expect(await screen.findByText('Thông báo Fanpage')).toBeDefined()
    // Check tabs
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeDefined()
    expect(screen.getByText('Chưa đọc')).toBeDefined()

    // Check notification content
    expect(await screen.findByText('Đăng ký tham gia')).toBeDefined()
    expect(await screen.findByText('Duyệt bài viết')).toBeDefined()
  })

  it('filters unread notifications when clicking "Chưa đọc" tab', async () => {
    vi.mocked(notificationService.getFanpageUnreadCount).mockResolvedValue(1)
    vi.mocked(notificationService.getFanpageNotifications).mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Đăng ký tham gia',
          message: 'Nguyễn Văn A muốn tham gia fanpage',
          status: 'UNREAD',
          createdAt: new Date().toISOString(),
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      last: true,
      first: true,
      empty: false,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FanpageNotificationDropdown
            isOpen={true}
            onClose={vi.fn()}
            fanpageId="1"
            fanpageName="CLB Tin Học"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const unreadTab = await screen.findByText('Chưa đọc')
    fireEvent.click(unreadTab)

    expect(await screen.findByText('Đăng ký tham gia')).toBeDefined()
  })
})
