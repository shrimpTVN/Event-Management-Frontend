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
