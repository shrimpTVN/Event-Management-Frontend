import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchPage } from '../SearchPage'
import { eventService } from '@/features/events'
import { fanpageSearchService } from '@/features/fanpage/services/fanpageSearchService'
import { useAuthStore } from '@/features/auth'

vi.mock('@/shared', () => ({
  apiClient: { get: vi.fn().mockResolvedValue([]) },
  formatEventTitle: (value: string) => value,
}))
vi.mock('@/features/fanpage/services/fanpageSearchService', () => ({
  fanpageSearchService: { search: vi.fn(), following: vi.fn() },
}))
vi.mock('@/features/events', async () => ({
  ...(await vi.importActual('@/features/events')),
  eventService: { getEvents: vi.fn() },
  StudentLeftSidebar: () => null,
  StudentRightSidebar: () => null,
  EventFeedCard: ({ event }: { event: { title: string } }) => <p>{event.title}</p>,
}))

function Location() {
  const location = useLocation()
  return <output aria-label="URL">{location.search}</output>
}
function show(path = '/search?keyword=AI&tab=all&eventTypeId=2&pageOrgType=CLUB') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(['event-filter-options'], {
    academicYears: [],
    semesters: [],
    eventTypes: [{ id: 2, label: 'Hội thảo' }],
    fanpages: [],
    pointCategories: [],
    criterias: [],
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ isAuthenticated: true, user: { id: 'student' } as any })
  vi.mocked(eventService.getEvents).mockResolvedValue([
    { id: 'event1', title: 'AI hội thảo', eventTypeId: '2', organizerId: '1' },
    { id: 'event2', title: 'AI thể thao', eventTypeId: '3', organizerId: '2' },
  ] as any)
  vi.mocked(fanpageSearchService.search).mockResolvedValue([
    { id: '1', name: 'CLB AI', orgType: 'CLUB' },
    { id: '2', name: 'Đoàn AI', orgType: 'YOUTH_UNION' },
  ])
  vi.mocked(fanpageSearchService.following).mockResolvedValue([{ id: '1', name: 'CLB AI' }])
})

describe('unified search tabs', () => {
  it('ignores type-specific filters in All and preserves each filter while switching tabs', async () => {
    show()
    expect(await screen.findByText('AI hội thảo')).toBeInTheDocument()
    expect(screen.getByText('AI thể thao')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Đoàn AI/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bộ lọc sự kiện' })).not.toBeInTheDocument()
    expect(vi.mocked(eventService.getEvents).mock.calls[0][0]).toEqual({ keyword: 'AI' })

    fireEvent.click(screen.getByRole('button', { name: 'Fanpage' }))
    expect(await screen.findByRole('button', { name: 'Bộ lọc fanpage' })).toBeInTheDocument()
    expect(screen.queryByText('AI hội thảo')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Đoàn AI/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /CLB AI/ })).toHaveAttribute('href', '/fanpage/1')

    fireEvent.click(screen.getByRole('button', { name: 'Sự kiện' }))
    expect(await screen.findByRole('button', { name: 'Bộ lọc sự kiện' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bỏ lọc: Hội thảo' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('AI thể thao')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Bộ lọc fanpage' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tất cả' }))
    expect(screen.getByLabelText('URL')).toHaveTextContent('pageOrgType=CLUB')
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('eventTypeId=')
    fireEvent.click(screen.getByRole('button', { name: 'Fanpage' }))
    expect(screen.getByRole('button', { name: 'Bỏ lọc loại đơn vị' })).toBeInTheDocument()
  })

  it('filters fanpages by following without affecting event filters', async () => {
    show('/search?keyword=AI&tab=fanpages&pageFollowing=yes&eventTypeId=2')
    expect(await screen.findByRole('link', { name: /CLB AI/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Đoàn AI/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc theo dõi' }))
    expect(await screen.findByRole('link', { name: /Đoàn AI/ })).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toHaveTextContent('eventTypeId=2')
  })

  it('applies fanpage filters only on confirmation and discards cancelled edits', async () => {
    show('/search?keyword=AI&tab=fanpages')
    await screen.findByRole('link', { name: /CLB AI/ })
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc fanpage' }))
    fireEvent.click(screen.getByRole('combobox', { name: 'Loại đơn vị' }))
    fireEvent.click(screen.getByRole('option', { name: 'Câu lạc bộ' }))
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('pageOrgType=')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc fanpage' }))
    expect(screen.getByRole('combobox', { name: 'Loại đơn vị' })).toHaveTextContent('Tất cả đơn vị')
    fireEvent.click(screen.getByRole('combobox', { name: 'Loại đơn vị' }))
    fireEvent.click(screen.getByRole('option', { name: 'Câu lạc bộ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))
    expect(screen.getByLabelText('URL')).toHaveTextContent('pageOrgType=CLUB')
    expect(screen.queryByRole('link', { name: /Đoàn AI/ })).not.toBeInTheDocument()
  })

  it('keeps event results and allows retrying the fanpage request on partial failure', async () => {
    vi.mocked(fanpageSearchService.search).mockRejectedValueOnce(new Error('offline'))
    show('/search?keyword=AI&tab=all')
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải fanpage')
    expect(screen.getByText('AI hội thảo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại fanpage' }))
    expect(await screen.findByRole('link', { name: /CLB AI/ })).toBeInTheDocument()
  })
})
