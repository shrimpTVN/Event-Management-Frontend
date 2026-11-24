import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLeftSidebar } from '../StudentLeftSidebar'
import { eventService } from '../../services/eventService'
import { apiClient } from '@/shared'
import { useAuthStore } from '@/features/auth'

vi.mock('@/shared', async () => {
  const actual = await vi.importActual<any>('@/shared')
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  }
})

vi.mock('../../services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
  },
}))

describe('StudentLeftSidebar Unread Indicator', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'test@ctu.edu.vn' } as any,
    })
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })

    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/fanpages/following')) {
        return {
          content: [
            { id: 1, name: 'CLB Tin Học', avatarUrl: '' },
            { id: 2, name: 'CLB Tiếng Anh', avatarUrl: '' },
          ],
        }
      }
      return []
    })
  })

  it('shows blue dot when fanpage has recent event and turns off after clicking fanpage', async () => {
    // Fanpage 1 has a fresh event created right now
    const now = Date.now()
    vi.mocked(eventService.getEvents).mockResolvedValue([
      {
        id: 'e1',
        title: 'Sự kiện mới CLB Tin Học',
        organizerId: '1',
        createdAt: new Date(now).toISOString(),
        startTime: new Date(now + 86400000).toISOString(),
      } as any,
    ])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <StudentLeftSidebar />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Wait for fanpage name to load
    expect(await screen.findByText('CLB Tin Học')).toBeInTheDocument()
    expect(screen.getByText('CLB Tiếng Anh')).toBeInTheDocument()

    // CLB Tin Học has a new event -> Should show unread dot
    const clbTinHocLink = screen.getByRole('link', { name: /CLB Tin Học/i })
    expect(screen.getByTestId('unread-dot-1')).toBeInTheDocument()

    // CLB Tiếng Anh has no events -> Should not show unread dot
    expect(screen.queryByTestId('unread-dot-2')).not.toBeInTheDocument()

    // Click on CLB Tin Học
    fireEvent.click(clbTinHocLink)

    // After clicking, the blue dot disappears
    expect(screen.queryByTestId('unread-dot-1')).not.toBeInTheDocument()
  })

  it('does not show blue dot for a fanpage with no events', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <StudentLeftSidebar />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('CLB Tin Học')).toBeInTheDocument()
    expect(screen.queryByText('Có sự kiện mới')).not.toBeInTheDocument()
  })

  it('keeps the original group order and shows four fanpages on phones until expanded', () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([])
    const orgs = Array.from({ length: 7 }, (_, index) => ({
      id: String(index + 1),
      name: `Fanpage ${index + 1}`,
      avatarUrl: '',
    }))
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/7']}>
          <StudentLeftSidebar mobile followedOrgs={orgs} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    // An active item outside the first four must not expand the phone menu by itself.
    expect(screen.getByText('Fanpage 4')).toBeInTheDocument()
    expect(screen.queryByText('Fanpage 5')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Trang đã theo dõi',
      'Sự kiện',
      'Bạn',
    ])
    expect(screen.getByRole('link', { name: 'Điểm rèn luyện' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sinh viên 5 tốt' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Quyền riêng tư' })).not.toBeInTheDocument()
    const expand = screen.getByRole('button', { name: 'Xem thêm (3)' })
    fireEvent.click(expand)
    expect(screen.getByText('Fanpage 7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thu gọn' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }))
    expect(screen.queryByText('Fanpage 5')).not.toBeInTheDocument()
  })

  it('preserves the six-fanpage limit and labels in the laptop sidebar', () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([])
    const orgs = Array.from({ length: 7 }, (_, index) => ({
      id: String(index + 1),
      name: `Fanpage ${index + 1}`,
      avatarUrl: '',
    }))
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StudentLeftSidebar followedOrgs={orgs} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText('Fanpage 6')).toBeInTheDocument()
    expect(screen.queryByText('Fanpage 7')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xem thêm (1)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quản lý điểm rèn luyện' })).toBeInTheDocument()
  })
})
