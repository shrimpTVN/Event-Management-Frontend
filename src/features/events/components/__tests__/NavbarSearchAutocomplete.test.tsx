import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavbarSearchAutocomplete } from '../NavbarSearchAutocomplete'
import { eventService } from '../../services/eventService'
import { fanpageSearchService } from '@/features/fanpage/services/fanpageSearchService'

vi.mock('@/features/fanpage/services/fanpageSearchService', () => ({
  fanpageSearchService: { search: vi.fn().mockResolvedValue([]) },
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/eventService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/eventService')>()),
  eventService: {
    getEvents: vi.fn(),
  },
}))

vi.mock('../../services/eventFilterOptionsService', () => ({
  eventFilterOptionsService: {
    getFilterOptions: vi.fn().mockResolvedValue({
      semesters: [{ id: 1, label: 'HK1 NH 2026 - 2027' }],
      eventTypes: [{ id: 2, label: 'Hội thảo' }],
      fanpages: [{ id: 3, label: 'Đoàn Trường CNTT & TT' }],
      criterias: [{ id: 4, label: 'Tiêu chí 1' }],
      pointCategories: [{ id: 5, label: 'Ý thức tham gia học tập' }],
    }),
  },
}))

describe('NavbarSearchAutocomplete', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(eventService.getEvents).mockResolvedValue([])
    vi.mocked(fanpageSearchService.search).mockResolvedValue([])
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderComponent = (path = '/events') =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <NavbarSearchAutocomplete />
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('hides the header filter on the student home page', () => {
    renderComponent('/')
    expect(screen.queryByLabelText('Mở bộ lọc nâng cao')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tìm kiếm sự kiện, fanpage…')).toBeInTheDocument()
  })

  it('leaves filtering to the results toolbar on the search page', () => {
    renderComponent('/search')
    expect(screen.queryByLabelText('Mở bộ lọc nâng cao')).not.toBeInTheDocument()
  })

  it('renders search without a filter button on the events page', () => {
    renderComponent()
    expect(screen.getByPlaceholderText('Tìm kiếm sự kiện, fanpage…')).toBeInTheDocument()
    expect(screen.queryByLabelText('Mở bộ lọc nâng cao')).not.toBeInTheDocument()
  })

  it('types text, fetches suggestions, and displays dropdown', async () => {
    const mockResults = [
      {
        id: 'ev-1',
        title: 'Hội thảo AI trong giáo dục',
        organizerName: 'Đoàn Trường CNTT & TT',
        pointsReward: '+5 ĐRL',
        status: 'PUBLISHED',
      },
    ]
    vi.mocked(eventService.getEvents).mockResolvedValueOnce(mockResults as any)

    renderComponent()
    const input = screen.getByPlaceholderText('Tìm kiếm sự kiện, fanpage…')
    fireEvent.change(input, { target: { value: 'Hội thảo' } })

    await waitFor(() => {
      expect(screen.getByText('Hội thảo AI trong giáo dục')).toBeInTheDocument()
      expect(screen.getByText('Sự kiện')).toBeInTheDocument()
    })
  })

  it('keeps long reward text out of suggestions and supports selecting with the keyboard', async () => {
    const title = 'Workshop tên rất dài để kiểm tra kết quả tìm kiếm'
    vi.mocked(eventService.getEvents).mockResolvedValueOnce([
      {
        id: 'ev-99',
        title,
        organizerName: 'Đoàn trường',
        startTime: '2026-11-20T08:00:00',
        pointsReward: 'Quyền lợi dài không được làm tràn dropdown',
      },
    ] as any)
    renderComponent()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Workshop' } })
    expect(await screen.findByRole('option', { name: title })).toBeInTheDocument()
    expect(screen.queryByText('Quyền lợi dài không được làm tràn dropdown')).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: title })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith('/events/ev-99')
  })

  it('submits search on Enter and navigates to /search?keyword=...', async () => {
    renderComponent()
    const input = screen.getByPlaceholderText('Tìm kiếm sự kiện, fanpage…')
    fireEvent.change(input, { target: { value: 'Workshop' } })
    fireEvent.submit(input.closest('form')!)

    expect(mockNavigate).toHaveBeenCalledWith('/search?tab=all&keyword=Workshop')
  })

  it('suggests fanpages alongside events and opens a selected fanpage', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([
      { id: 'event', title: 'AI hội thảo' },
    ] as any)
    vi.mocked(fanpageSearchService.search).mockResolvedValue([{ id: 'page', name: 'CLB AI' }])
    renderComponent()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'AI' } })
    expect(await screen.findByRole('option', { name: 'AI hội thảo' })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('option', { name: 'CLB AI' }))
    expect(mockNavigate).toHaveBeenCalledWith('/fanpage/page')
  })

  it('shows successful suggestions even if the other source fails', async () => {
    vi.mocked(eventService.getEvents).mockRejectedValue(new Error('offline'))
    vi.mocked(fanpageSearchService.search).mockResolvedValue([{ id: 'page', name: 'CLB AI' }])
    renderComponent()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'AI' } })
    expect(await screen.findByRole('option', { name: 'CLB AI' })).toBeInTheDocument()
    expect(screen.getByText('Chưa tải được đầy đủ gợi ý.')).toBeInTheDocument()
  })

  it('aborts earlier in-flight requests when typing rapidly and renders only the latest query suggestions', async () => {
    const seenSignals: AbortSignal[] = []
    let resolveFirst!: (value: any[]) => void
    let resolveFirstPage!: (value: any[]) => void

    vi.mocked(eventService.getEvents).mockImplementation((filters) => {
      if (filters?.signal) seenSignals.push(filters.signal)
      if (filters?.keyword === 'ab') {
        return new Promise((resolve) => {
          resolveFirst = resolve
        })
      }
      return Promise.resolve([{ id: 'latest-ev', title: 'Sự kiện abc mới nhất' }] as any)
    })

    vi.mocked(fanpageSearchService.search).mockImplementation((keyword, _size, signal) => {
      if (signal) seenSignals.push(signal)
      if (keyword === 'ab') {
        return new Promise((resolve) => {
          resolveFirstPage = resolve
        })
      }
      return Promise.resolve([{ id: 'latest-fp', name: 'Fanpage abc mới nhất' }])
    })

    renderComponent()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'a' } })
    await new Promise((resolve) => setTimeout(resolve, 50))
    fireEvent.change(input, { target: { value: 'ab' } })

    await waitFor(() => {
      expect(eventService.getEvents).toHaveBeenCalledTimes(1)
    })
    expect(eventService.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'ab',
        size: 3,
        statuses: ['PUBLISHED'],
        signal: expect.any(AbortSignal),
      })
    )

    fireEvent.change(input, { target: { value: 'abc' } })
    expect(seenSignals.length).toBeGreaterThanOrEqual(2)
    expect(seenSignals.every((sig) => sig.aborted)).toBe(true)

    resolveFirst([{ id: 'stale-ev', title: 'Sự kiện ab cũ' }])
    resolveFirstPage([{ id: 'stale-fp', name: 'Fanpage ab cũ' }])

    expect(
      await screen.findByRole('option', { name: 'Sự kiện abc mới nhất' })
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Fanpage abc mới nhất' })).toBeInTheDocument()
    expect(screen.queryByText('Sự kiện ab cũ')).not.toBeInTheDocument()
    expect(screen.queryByText('Fanpage ab cũ')).not.toBeInTheDocument()
  })

  it.each(['/saved', '/notifications', '/history', '/profile', '/fanpage/1'])(
    'omits the header filter on %s',
    (path) => {
      renderComponent(path)
      expect(screen.queryByLabelText('Mở bộ lọc nâng cao')).not.toBeInTheDocument()
      expect(
        screen.getByRole('combobox', { name: 'Tìm kiếm sự kiện và fanpage' })
      ).toBeInTheDocument()
    }
  )
})
