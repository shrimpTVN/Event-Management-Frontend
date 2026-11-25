import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventHistoryPage } from '../EventHistoryPage'
import { historyService } from '@/features/registration-history'
import { MobilePageProvider, useMobilePageSearch } from '@/shared/components/layout/MobileSubpageHeader'

// Mock dependencies
vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn((url: string) => {
      if (url === '/academic-years') {
        return Promise.resolve({
          data: [
            { id: 1, code: '2026-2027', isActive: true },
            { id: 2, code: '2025-2026', isActive: false },
          ],
        })
      }
      if (url === '/semesters') {
        return Promise.resolve({
          data: [
            { id: 1, number: 1, academicYearId: 1, status: 'ONGOING' },
            { id: 2, number: 2, academicYearId: 1, status: 'UPCOMING' },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    }),
  },
  formatEventTitle: (v: string) => v,
}))

// Mock useMediaQuery to simulate mobile (< 768px)
let mockIsPhone = true
vi.mock('@/shared/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockIsPhone,
}))

const mockHistoryEvents = [
  {
    id: 'reg-1',
    eventId: 101,
    title: 'Hội thảo Trí tuệ Nhân tạo AI 2026',
    organizer: { name: 'CLB Tin học' },
    location: 'Hội trường Rùa',
    dateHappen: '15/09/2026',
    status: 'REGISTERED',
    startsAt: '2026-12-15T08:00:00+07:00',
    canCancel: true,
  },
  {
    id: 'reg-2',
    eventId: 102,
    title: 'Giải chạy sinh viên CTU Marathon',
    organizer: { name: 'Đoàn Thanh niên' },
    location: 'Sân vận động',
    dateHappen: '20/10/2026',
    status: 'COMPLETED',
  },
  {
    id: 'reg-3',
    eventId: 103,
    title: 'Ngày hội Hiến máu nhân đạo',
    organizer: { name: 'Hội Chữ thập đỏ' },
    location: 'Nhà thi đấu',
    dateHappen: '10/11/2026',
    status: 'ABSENT',
  },
]

describe('EventHistoryPage on Mobile (< 768px)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-25T08:00:00+07:00'))
    mockIsPhone = true
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
    vi.spyOn(historyService, 'getMyHistory').mockResolvedValue(mockHistoryEvents as any)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('renders mobile status tab bar with semantic labels, counts and no duplicate title', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Wait for events to load
    await waitFor(() => {
      expect(screen.getByText('Hội thảo Trí tuệ Nhân tạo AI 2026')).toBeInTheDocument()
    })

    // Status tabs should be present
    expect(screen.getByRole('button', { name: /^Tất cả/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sắp diễn ra/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Đã điểm danh/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Vắng/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Đã hủy/ })).toBeInTheDocument()

    // Title should have data-mobile-page-heading and hidden md:block (not duplicated in mobile body)
    const heading = screen.getByRole('heading', { level: 1, name: 'Lịch sử tham gia' })
    expect(heading).toHaveClass('hidden')
  })

  it('renders year and semester bottom sheet triggers on same row without desktop Tìm button on mobile', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Hội thảo Trí tuệ Nhân tạo AI 2026')).toBeInTheDocument()
    })

    // Year and semester sheet buttons should exist with accessible labels
    const yearTrigger = screen.getByRole('button', { name: 'Chọn năm học' })
    const semesterTrigger = screen.getByRole('button', { name: 'Chọn học kỳ' })
    expect(yearTrigger).toBeInTheDocument()
    expect(semesterTrigger).toBeInTheDocument()

    // Desktop "Tìm" button should not be visible on mobile (it has hidden md:flex)
    const findButtons = screen.queryAllByRole('button', { name: 'Tìm' })
    findButtons.forEach((btn) => {
      expect(btn).toHaveClass('hidden')
    })
  })

  it('displays result count line and filters events when clicking status tabs', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('3 sự kiện')).toBeInTheDocument()
    })

    // Click "Sắp diễn ra" tab
    fireEvent.click(screen.getByRole('button', { name: /^Sắp diễn ra/ }))
    expect(screen.getByText('1 sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Hội thảo Trí tuệ Nhân tạo AI 2026')).toBeInTheDocument()
    expect(screen.queryByText('Giải chạy sinh viên CTU Marathon')).not.toBeInTheDocument()

    // Click "Vắng" tab
    fireEvent.click(screen.getByRole('button', { name: /^Vắng/ }))
    expect(screen.getByText('1 sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Ngày hội Hiến máu nhân đạo')).toBeInTheDocument()
  })

  it('displays contextual empty state when no events exist in the tab', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('3 sự kiện')).toBeInTheDocument()
    })

    // Click "Đã hủy" tab (no cancelled events in mock data)
    fireEvent.click(screen.getByRole('button', { name: /^Đã hủy/ }))
    expect(
      screen.getByText('Chưa có sự kiện đã hủy trong học kỳ này')
    ).toBeInTheDocument()
  })

  it('only shows future REGISTERED events in the upcoming tab', async () => {
    const base = mockHistoryEvents[0]
    vi.spyOn(historyService, 'getMyHistory').mockResolvedValue([
      { ...base, title: 'Đã bắt đầu', startsAt: '2026-11-25T08:00:00+07:00' },
      { ...base, id: 'future', eventId: 201, title: 'Chưa bắt đầu' },
      { ...base, id: 'checked', eventId: 202, title: 'Đã check-in', status: 'CHECKED_IN' },
      { ...base, id: 'unknown', eventId: 203, title: 'Thiếu thời gian', startsAt: undefined },
    ])
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider><EventHistoryPage /></MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() => expect(screen.getByText('4 sự kiện')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^Sắp diễn ra/ }))
    expect(screen.getByText('1 sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Chưa bắt đầu')).toBeInTheDocument()
    expect(screen.queryByText('Đã bắt đầu')).not.toBeInTheDocument()
    expect(screen.queryByText('Đã check-in')).not.toBeInTheDocument()
    expect(screen.queryByText('Thiếu thời gian')).not.toBeInTheDocument()
  })

  it('renders error state with retry button on query failure', async () => {
    vi.spyOn(historyService, 'getMyHistory').mockRejectedValueOnce(new Error('Network error'))

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Không thể tải danh sách sự kiện')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    })
  })

  it('immediately applies year and semester filter when selecting from bottom sheet', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <EventHistoryPage />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('3 sự kiện')).toBeInTheDocument()
    })

    // Open year bottom sheet
    const yearTrigger = screen.getByRole('button', { name: 'Chọn năm học' })
    fireEvent.click(yearTrigger)

    // Option for 2025 - 2026 should be visible in sheet
    const yearOption = await screen.findByRole('button', { name: '2025 - 2026' })
    fireEvent.click(yearOption)

    // Year trigger now displays 2025 - 2026 immediately, without needing a "Tìm" click
    expect(screen.getByRole('button', { name: 'Chọn năm học' })).toHaveTextContent('2025 - 2026')
  })

  it('clears only search term when clicking Xóa tìm kiếm, preserving active tab and term filters', async () => {
    // Component wrapper that sets initial search query
    const SearchTriggerWrapper = () => {
      const search = useMobilePageSearch()
      return (
        <div>
          <button
            type="button"
            onClick={() => search.setQuery?.('không có sự kiện nào')}
          >
            Trigger Search
          </button>
          <EventHistoryPage />
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MobilePageProvider>
            <SearchTriggerWrapper />
          </MobilePageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('3 sự kiện')).toBeInTheDocument()
    })

    // Trigger search that matches nothing
    fireEvent.click(screen.getByText('Trigger Search'))

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sự kiện phù hợp')).toBeInTheDocument()
    })

    const clearButton = screen.getByRole('button', { name: 'Xóa tìm kiếm' })
    expect(clearButton).toBeInTheDocument()
    fireEvent.click(clearButton)

    // Restores list
    await waitFor(() => {
      expect(screen.getByText('3 sự kiện')).toBeInTheDocument()
    })
  })
})
