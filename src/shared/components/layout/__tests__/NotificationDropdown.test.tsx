import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationDropdown } from '../NotificationDropdown'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { useAuthStore } from '@/features/auth/store/authStore'

vi.mock('@/features/fanpage/services/fanpageService', () => ({
  fanpageService: {
    getMyInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
  },
}))

vi.mock('@/features/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/notifications')>()
  return {
    ...actual,
    notificationService: {
      ...actual.notificationService,
      getMyNotifications: vi.fn().mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: 20,
        number: 0,
        last: true,
        first: true,
        empty: true,
      }),
      getUnreadCount: vi.fn().mockResolvedValue(0),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      markAllAsRead: vi.fn().mockResolvedValue(undefined),
    },
    useNotificationStream: vi.fn(),
  }
})

describe('NotificationDropdown', () => {
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
        userFirstName: 'Minh Anh',
        userLastName: 'Nguyễn',
        status: 'PENDING',
        createdAt: '2026-11-05T13:00:00Z',
      },
    ])
  })

  it('renders real fanpage invitation for student', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationDropdown isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Nguyễn Minh Anh/i)).toBeInTheDocument()
      expect(screen.getByText(/Đoàn Trường CNTT & TT/i)).toBeInTheDocument()
      expect(screen.getByText('Chấp nhận')).toBeInTheDocument()
      expect(screen.getByText('Từ chối')).toBeInTheDocument()
    })
  })

  it('calls acceptInvitation when student clicks Chấp nhận', async () => {
    vi.mocked(fanpageService.acceptInvitation).mockResolvedValue(undefined)
    const onAccepted = vi.fn()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationDropdown
            isOpen={true}
            onClose={vi.fn()}
            onAccepted={onAccepted}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Chấp nhận')).toBeInTheDocument()
    })

    const acceptBtn = screen.getByText('Chấp nhận')
    fireEvent.click(acceptBtn)

    await waitFor(() => {
      expect(fanpageService.acceptInvitation).toHaveBeenCalledWith(1)
      expect(onAccepted).toHaveBeenCalledWith('Đoàn Trường CNTT & TT')
    })
  })
})
