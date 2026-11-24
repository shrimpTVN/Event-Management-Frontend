import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationsPage } from '../NotificationsPage'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { notificationService } from '@/features/notifications/services/notificationService'
import { useAuthStore } from '@/features/auth/store/authStore'

vi.mock('@/features/fanpage/services/fanpageService', () => ({
  fanpageService: {
    getMyInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
  },
}))

vi.mock('@/features/notifications/services/notificationService', () => ({
  notificationService: {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn().mockResolvedValue(1),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('NotificationsPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    useAuthStore.setState({
      user: {
        id: '115',
        email: 'locb2303827@student.ctu.edu.vn',
        name: 'Đoàn Tài Lộc',
        role: 'STUDENT',
      } as any,
    })
    vi.clearAllMocks()
    vi.mocked(fanpageService.getMyInvitations).mockResolvedValue([
      {
        id: 1,
        fanpageId: 10,
        fanpageName: 'Đoàn Trường CNTT & TT',
        inviterName: 'Nguyễn Minh Anh',
        userFirstName: 'Minh Anh',
        userLastName: 'Nguyễn',
        status: 'PENDING',
        createdAt: '2026-11-05T13:00:00Z',
      },
    ])
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue({
      content: [
        {
          id: 'notif-1',
          title: 'Điểm rèn luyện đã được cộng',
          message: 'Bạn nhận được 5 điểm rèn luyện từ sự kiện Hội thảo AI.',
          status: 'UNREAD',
          createdAt: '2026-11-20T10:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 50,
      number: 0,
      last: true,
      first: true,
      empty: false,
    })
  })

  it('renders title, fanpage invitation and system notifications', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Thông báo/i })).toBeInTheDocument()
      expect(screen.getByText(/Nguyễn Minh Anh/i)).toBeInTheDocument()
      expect(screen.getByText(/Đoàn Trường CNTT & TT/i)).toBeInTheDocument()
      expect(screen.getByText('Chấp nhận')).toBeInTheDocument()
      expect(screen.getByText('Từ chối')).toBeInTheDocument()
      expect(screen.getByText('Điểm rèn luyện đã được cộng')).toBeInTheDocument()
    })
  })

  it('calls acceptInvitation when student clicks Chấp nhận', async () => {
    vi.mocked(fanpageService.acceptInvitation).mockResolvedValue(undefined)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Chấp nhận')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Chấp nhận'))

    await waitFor(() => {
      expect(fanpageService.acceptInvitation).toHaveBeenCalledWith(1)
    })
  })
})
