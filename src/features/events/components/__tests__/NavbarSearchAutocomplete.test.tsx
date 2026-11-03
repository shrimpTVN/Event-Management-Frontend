import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavbarSearchAutocomplete } from '../NavbarSearchAutocomplete'
import { eventService } from '../../services/eventService'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/eventService', () => ({
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
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NavbarSearchAutocomplete />
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('renders search input and filter button', () => {
    renderComponent()
    expect(screen.getByPlaceholderText('Tìm kiếm sự kiện...')).toBeInTheDocument()
    expect(screen.getByLabelText('Mở bộ lọc nâng cao')).toBeInTheDocument()
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
    const input = screen.getByPlaceholderText('Tìm kiếm sự kiện...')
    fireEvent.change(input, { target: { value: 'Hội thảo' } })

    await waitFor(() => {
      expect(screen.getByText('Hội thảo AI trong giáo dục')).toBeInTheDocument()
      expect(screen.getByText(/Gợi ý sự kiện phù hợp/i)).toBeInTheDocument()
    })
  })

  it('submits search on Enter and navigates to /search?keyword=...', async () => {
    renderComponent()
    const input = screen.getByPlaceholderText('Tìm kiếm sự kiện...')
    fireEvent.change(input, { target: { value: 'Workshop' } })
    fireEvent.submit(input.closest('form')!)

    expect(mockNavigate).toHaveBeenCalledWith('/search?keyword=Workshop')
  })

  it('opens filter popup dropping from top when clicking filter button', async () => {
    renderComponent()
    const filterBtn = screen.getByLabelText('Mở bộ lọc nâng cao')
    fireEvent.click(filterBtn)

    await waitFor(() => {
      expect(screen.getByText('Bộ lọc sự kiện')).toBeInTheDocument()
      expect(screen.getByText('Học kỳ')).toBeInTheDocument()
      expect(screen.getByText('Loại hình sự kiện')).toBeInTheDocument()
      expect(screen.getByText('Đơn vị tổ chức (Fanpage)')).toBeInTheDocument()
    })
  })
})

