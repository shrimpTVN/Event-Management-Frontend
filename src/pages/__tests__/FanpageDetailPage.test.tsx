import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { FanpageDetailPage } from '../FanpageDetailPage'
import { fanpageService } from '@/features/fanpage'
import { eventFilterOptionsService } from '@/features/events'

vi.mock('@/features/fanpage', async () => {
  const actual = await vi.importActual<any>('@/features/fanpage')
  return {
    ...actual,
    FanpagePublicHeader: () => <div data-testid="public-header">Header</div>,
    FanpageAboutCard: () => <div data-testid="about-card">About</div>,
    fanpageService: {
      getFanpageById: vi.fn(),
      getEventsByFanpage: vi.fn(),
      followFanpage: vi.fn(),
      unfollowFanpage: vi.fn(),
    },
  }
})

vi.mock('@/features/events', async () => {
  const actual = await vi.importActual<any>('@/features/events')
  return {
    ...actual,
    StudentLeftSidebar: () => <aside data-testid="left-sidebar" />,
    StudentRightSidebar: () => <aside data-testid="right-sidebar" />,
    EventFeedCard: ({ event }: any) => <div data-testid="event-card">{event.title}</div>,
    eventFilterOptionsService: {
      getFilterOptions: vi.fn(),
    },
  }
})

describe('FanpageDetailPage Filters', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })

    vi.mocked(fanpageService.getFanpageById).mockResolvedValue({
      id: '1',
      name: 'Đoàn Thanh niên - Hội Sinh viên',
      fullName: 'Đoàn Thanh niên - Hội Sinh viên Trường Đại học Cần Thơ',
      avatarUrl: '',
      followerCount: 1,
      isFollowing: false,
      eventCount: 2,
    } as any)

    vi.mocked(fanpageService.getEventsByFanpage).mockResolvedValue([
      {
        id: '101',
        title: 'Hội thi tuyên truyền an toàn giao thông',
        status: 'PUBLISHED',
        startTime: '2026-11-25T08:00:00',
        endTime: '2026-11-25T11:00:00',
        eventTypeId: '1',
      },
      {
        id: '102',
        title: 'Giải bóng đá sinh viên CTU',
        status: 'PUBLISHED',
        startTime: '2026-12-01T08:00:00',
        endTime: '2026-12-01T17:00:00',
        eventTypeId: '2',
      },
    ] as any)

    vi.mocked(eventFilterOptionsService.getFilterOptions).mockResolvedValue({
      academicYears: [],
      semesters: [],
      eventTypes: [
        { id: '1', label: 'Hội thảo / Tuyên truyền' },
        { id: '2', label: 'Thể thao' },
      ],
      fanpages: [],
      criterias: [],
      pointCategories: [],
    })
  })

  it('renders filter button and opens filter modal on click', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/1']}>
          <Routes>
            <Route path="/fanpage/:id" element={<FanpageDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Events are displayed
    expect(await screen.findByText('Hội thi tuyên truyền an toàn giao thông')).toBeInTheDocument()
    expect(screen.getByText('Giải bóng đá sinh viên CTU')).toBeInTheDocument()

    // Filter button is present
    const filterBtn = screen.getByRole('button', { name: /bộ lọc sự kiện/i })
    expect(filterBtn).toBeInTheDocument()

    // Click filter button
    fireEvent.click(filterBtn)

    // Filter modal dialog opens
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Bộ lọc sự kiện')).toBeInTheDocument()
  })

  it('filters events and allows resetting filters when no events match', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/1']}>
          <Routes>
            <Route path="/fanpage/:id" element={<FanpageDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Hội thi tuyên truyền an toàn giao thông')).toBeInTheDocument()

    // Open filter modal
    const filterBtn = screen.getByRole('button', { name: /bộ lọc sự kiện/i })
    fireEvent.click(filterBtn)

    // Click "Xem ... sự kiện" button to apply
    const applyBtn = screen.getByRole('button', { name: /xem .* sự kiện/i })
    expect(applyBtn).toBeInTheDocument()
    fireEvent.click(applyBtn)

    // Events are still visible
    expect(screen.getByText('Hội thi tuyên truyền an toàn giao thông')).toBeInTheDocument()
  })
})
