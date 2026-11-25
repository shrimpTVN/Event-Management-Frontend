import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchPage } from '../SearchPage'
import {
  MobilePageProvider,
  MobileSubpageHeader,
} from '@/shared/components/layout/MobileSubpageHeader'
import { eventService, type Event } from '@/features/events'

vi.mock('@/features/fanpage/services/fanpageSearchService', () => ({
  fanpageSearchService: { search: vi.fn().mockResolvedValue([]) },
}))

vi.mock('@/features/events/services/eventService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/events/services/eventService')>()),
  eventService: { getEvents: vi.fn() },
}))

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: () => true }))
vi.mock('@/features/events', async () => ({
  ...(await vi.importActual('@/features/events')),
  eventService: { getEvents: vi.fn() },
  StudentLeftSidebar: () => null,
  StudentRightSidebar: () => null,
}))
const event = (id = '1', title = 'Workshop AI'): Event =>
  ({
    id,
    title,
    description: 'Mô tả dài chỉ dành cho trang chi tiết',
    organizerId: '1',
    organizerName: 'Đoàn trường',
    status: 'CLOSED',
    category: 'WORKSHOP',
    semesterId: 1,
    startTime: '2027-12-01T08:00:00',
    endTime: '2027-12-01T10:00:00',
    location: { type: 'OFFLINE', address: 'Hội trường A' },
    capacity: 100,
  }) as Event
function RouteState() {
  const route = useLocation()
  return (
    <output aria-label="URL">
      {route.pathname}
      {route.search}
    </output>
  )
}
function Detail() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>Trở lại kết quả</button>
}
function show(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(['event-filter-options'], {
    academicYears: [],
    semesters: [{ id: 1, label: 'Học kỳ 1' }],
    eventTypes: [],
    fanpages: [],
    pointCategories: [],
    criterias: [],
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <MobilePageProvider>
          <RouteState />
          <Routes>
            <Route
              path="/events"
              element={
                <>
                  <MobileSubpageHeader />
                  <SearchPage />
                </>
              }
            />
            <Route
              path="/search"
              element={
                <>
                  <MobileSubpageHeader />
                  <SearchPage />
                </>
              }
            />
            <Route path="/events/:id" element={<Detail />} />
          </Routes>
        </MobilePageProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('mobile event search', () => {
  it('has one search field and compact linked results with category and status', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([event()])
    show('/events?keyword=AI&semesterId=1')
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
    expect(screen.getByRole('searchbox')).not.toHaveFocus()
    expect(await screen.findByRole('heading', { name: 'Workshop AI' })).toBeInTheDocument()
    expect(screen.getByText('Workshop', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Đã đóng đăng ký')).toBeInTheDocument()
    expect(screen.getByText('Hội trường A')).toBeInTheDocument()
    expect(screen.queryByText('Mô tả dài chỉ dành cho trang chi tiết')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Bình luận|Chia sẻ|^Đăng ký$/ })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Workshop AI/ })).toHaveAttribute('href', '/events/1')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa lọc' }))
    expect(screen.getByLabelText('URL')).toHaveTextContent('/events?keyword=AI')
    expect(screen.getByRole('searchbox')).toHaveValue('AI')
  })

  it('keeps Vietnamese input as a draft until submit, including when clearing', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([event()])
    show('/events?semesterId=1')
    await screen.findByRole('heading', { name: 'Workshop AI' })
    const input = screen.getByRole('searchbox')
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'Hội' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('keyword=')
    fireEvent.compositionEnd(input)
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('keyword=')
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByLabelText('URL').textContent).toContain('keyword=H%E1%BB%99i')
    expect(screen.getByLabelText('URL')).toHaveTextContent('tab=all')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa từ khóa' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('keyword=')
    expect(screen.getByLabelText('URL')).toHaveTextContent('semesterId=1')
  })

  it('keeps results while fetching and ignores late responses for an older keyword', async () => {
    let resolveOld!: (value: Event[]) => void
    let resolveNew!: (value: Event[]) => void
    vi.mocked(eventService.getEvents).mockImplementation((filters) => {
      if (filters?.keyword === 'old')
        return new Promise((resolve) => {
          resolveOld = resolve
        })
      if (filters?.keyword === 'new')
        return new Promise((resolve) => {
          resolveNew = resolve
        })
      return Promise.resolve([event('initial', 'Kết quả ban đầu')])
    })
    show('/events?keyword=start')
    await screen.findByText('Kết quả ban đầu')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'old' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByText('Kết quả ban đầu')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new' } })
    fireEvent.submit(screen.getByRole('search'))
    await act(async () => {
      resolveNew([event('new', 'Kết quả mới')])
    })
    await screen.findByText('Kết quả mới')
    await act(async () => {
      resolveOld([event('old', 'Kết quả cũ')])
    })
    expect(screen.queryByText('Kết quả cũ')).not.toBeInTheDocument()
    expect(screen.getByText('Kết quả mới')).toBeInTheDocument()
  })

  it('restores revealed results and scroll position after returning from details', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue(
      Array.from({ length: 21 }, (_, i) => event(String(i), `Sự kiện ${i}`))
    )
    show('/events?keyword=restore')
    await screen.findByText('Sự kiện 0')
    expect(screen.queryByText('Sự kiện 20')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm kết quả' }))
    expect(screen.getByText('Sự kiện 20')).toBeInTheDocument()
    const main = screen.getByRole('main')
    vi.useFakeTimers()
    main.scrollTop = 450
    fireEvent.scroll(main)
    expect(main).toHaveAttribute('data-scrolling', 'true')
    act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(main).not.toHaveAttribute('data-scrolling')
    vi.useRealTimers()
    fireEvent.click(screen.getByRole('link', { name: /Sự kiện 20/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Trở lại kết quả' }))
    await screen.findByText('Sự kiện 20')
    await waitFor(() => expect(screen.getByRole('main').scrollTop).toBe(450))
    expect(screen.getByRole('searchbox')).toHaveValue('restore')
    expect(screen.getByRole('searchbox')).not.toHaveFocus()
  })

  it('applies bottom-sheet filters only after confirmation and discards cancelled changes', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([event()])
    show('/events?keyword=sheet')
    await screen.findByText('Workshop AI')
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đang diễn ra' }))
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('status=')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bộ lọc' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    expect(screen.getByRole('button', { name: 'Đang diễn ra' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đang diễn ra' }))
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }))
    expect(screen.getByLabelText('URL')).toHaveTextContent('keyword=sheet&status=ONGOING')
    expect(screen.getByRole('searchbox')).toHaveValue('sheet')
  })

  it('shows a retry action for network failure instead of an empty search result', async () => {
    vi.mocked(eventService.getEvents)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue([event()])
    show('/events?keyword=retry')
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải kết quả tìm kiếm')
    expect(screen.queryByText('Không tìm thấy sự kiện phù hợp')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Workshop AI')).toBeInTheDocument()
  })
})
