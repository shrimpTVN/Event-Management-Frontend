import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SavedEventsPage } from '../SavedEventsPage'
import { eventService } from '@/features/events'

vi.mock('@/features/events', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    eventService: {
      ...actual.eventService,
      getStoredEvents: vi.fn(),
      unstoreEvent: vi.fn(),
      storeEvent: vi.fn(),
    },
    StudentLeftSidebar: () => <div data-testid="left-sidebar">Left Sidebar</div>,
    StudentRightSidebar: () => <div data-testid="right-sidebar">Right Sidebar</div>,
  }
})

vi.mock('@/features/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: true, user: { id: '1', email: 'student@ctu.edu.vn' } }),
}))

describe('SavedEventsPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('renders saved events page with list of stored events', async () => {
    vi.mocked(eventService.getStoredEvents).mockResolvedValue([
      {
        id: '101',
        title: 'Hội thảo Trí tuệ Nhân tạo 2026',
        description: 'Mô tả chi tiết',
        category: 'ACADEMIC',
        status: 'PUBLISHED',
        startTime: '2026-11-15T08:00:00Z',
        endTime: '2026-11-15T11:00:00Z',
        location: { type: 'OFFLINE', address: 'Hội trường Rùa' },
        capacity: 100,
        registeredCount: 45,
        price: 0,
        organizerId: '1',
        organizerName: 'Đoàn Trường CNTT',
        pointsReward: '+5 ĐRL',
        isSaved: true,
      } as any,
    ])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedEventsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByRole('heading', { name: 'Đã lưu' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Hội thảo Trí tuệ Nhân tạo 2026')).toBeInTheDocument()
    })
    expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument()
  })

  it('renders empty state when there are no saved events', async () => {
    vi.mocked(eventService.getStoredEvents).mockResolvedValue([])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedEventsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Chưa có sự kiện nào được lưu')).toBeInTheDocument()
    })
  })

  it('searches saved events on desktop and restores them when the query is cleared', async () => {
    vi.mocked(eventService.getStoredEvents).mockResolvedValue([
      {
        id: '201',
        title: 'Ngày hội tình nguyện',
        description: 'Hoạt động cộng đồng',
        organizerName: 'Đoàn khoa',
        location: { type: 'OFFLINE', address: 'Hội trường Rùa' },
      } as any,
    ])
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedEventsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
    await screen.findByText('Ngày hội tình nguyện')
    const input = screen.getByRole('searchbox', { name: 'Tìm sự kiện đã lưu' })
    fireEvent.change(input, { target: { value: 'hoi truong rua' } })
    expect(screen.getByText('Ngày hội tình nguyện')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'không khớp' } })
    expect(screen.getByText('Không tìm thấy sự kiện đã lưu')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có sự kiện nào được lưu')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa tìm kiếm' })[0])
    expect(screen.getByText('Ngày hội tình nguyện')).toBeInTheDocument()
  })

  it('shows a retry action on loading failure instead of an empty saved list', async () => {
    vi.mocked(eventService.getStoredEvents).mockRejectedValueOnce(new Error('Network unavailable'))
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SavedEventsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải sự kiện đã lưu.')
    expect(screen.queryByText('Chưa có sự kiện nào được lưu')).not.toBeInTheDocument()
    vi.mocked(eventService.getStoredEvents).mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Chưa có sự kiện nào được lưu')).toBeInTheDocument()
  })
})
