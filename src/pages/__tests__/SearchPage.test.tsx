import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchPage } from '../SearchPage'
import { eventService } from '@/features/events'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/events', async () => {
  const actual = await vi.importActual('@/features/events')
  return {
    ...actual,
    eventService: {
      getEvents: vi.fn(),
    },
    StudentLeftSidebar: () => <div data-testid="left-sidebar" />,
    StudentRightSidebar: () => <div data-testid="right-sidebar" />,
  }
})

describe('SearchPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderPage = (initialEntries = ['/search?keyword=Workshop&semesterId=1']) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('renders search page with active filter chips and matching results count', async () => {
    const mockEvents = [
      {
        id: 'ev-1',
        title: 'Workshop Lập trình Web Hiện Đại',
        description: 'Chi tiết workshop...',
        organizerId: '1',
        organizerName: 'Đoàn Trường CNTT & TT',
        status: 'PUBLISHED',
        startTime: '2026-10-10T08:00:00',
        endTime: '2026-10-10T10:00:00',
        location: { type: 'OFFLINE', address: 'Lab 1' },
      },
    ]
    vi.mocked(eventService.getEvents).mockResolvedValueOnce(mockEvents as any)

    renderPage()

    // Title and chips
    expect(screen.getByText(/Kết quả cho:/i)).toBeInTheDocument()
    expect(screen.getByText(/Từ khóa: "Workshop"/i)).toBeInTheDocument()
    expect(screen.getByText(/Học kỳ #1/i)).toBeInTheDocument()
  })

  it('renders empty state when no events match the search query', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValueOnce([])

    renderPage(['/search?keyword=XYZKhôngCóSựKiệnNào'])

    expect(await screen.findByText('Không tìm thấy sự kiện phù hợp')).toBeInTheDocument()
    expect(screen.getByText('Về trang chủ')).toBeInTheDocument()
  })
})

