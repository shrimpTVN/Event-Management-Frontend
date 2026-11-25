import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
import { type Event, getPendingEventViewBatch } from '@/features/events'
import { formatRecommendationExplain, normalizeEvent } from '@/features/events/services/eventService'
import { HomePage } from '../HomePage'

vi.mock('@/features/events/components/StudentLeftSidebar', () => ({
  StudentLeftSidebar: () => null,
}))
vi.mock('@/features/events/components/StudentRightSidebar', () => ({
  StudentRightSidebar: () => null,
}))

const event: Event = {
  id: '1',
  title: 'Workshop kỹ năng',
  description: 'Nội dung bài viết workshop',
  category: 'WORKSHOP',
  eventTypeId: 2,
  status: 'PUBLISHED',
  startTime: '2027-01-15T08:00:00',
  endTime: '2027-01-15T10:00:00',
  location: { type: 'OFFLINE', address: 'Hội trường A' },
  capacity: 80,
  registeredCount: 20,
  price: 0,
  organizerId: '10',
  organizerName: 'Đoàn trường',
  isFollowed: true,
  isModerationRequired: false,
  createdAt: '2026-11-15T08:00:00',
  updatedAt: '2026-11-15T08:00:00',
}

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
  client.setQueryData(['event-filter-options'], {
    academicYears: [],
    semesters: [],
    eventTypes: [
      { id: 2, label: 'Workshop' },
      { id: 3, label: 'Hội thảo' },
    ],
    fanpages: [],
    criterias: [],
    pointCategories: [],
  })
  client.setQueryData(
    ['events', 'feed'],
    [
      event,
      {
        ...event,
        id: '2',
        title: 'Sự kiện khác',
        description: 'Bài viết khác',
        isFollowed: false,
        eventTypeId: 3,
      },
    ]
  )
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('student home event views', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: false, user: null })
    vi.spyOn(apiClient, 'post').mockResolvedValue(undefined as any)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('applies the local filter with matching preview, keeps it across views, and clears its chip', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả loại hình' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hội thảo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem 1 sự kiện' }))
    expect(screen.queryByText(event.title)).not.toBeInTheDocument()
    expect(screen.getByText('Sự kiện khác')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách' }))
    expect(screen.queryByText(event.title)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc: Hội thảo' }))
    expect(screen.getByText(event.title)).toBeInTheDocument()
  })

  it('keeps the selected feed filter and event data when switching views', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Đang theo dõi' }))
    expect(screen.getByText(event.description)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách' }))
    expect(screen.getByRole('button', { name: 'Danh sách' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText(event.title)).toBeInTheDocument()
    expect(screen.queryByText(event.description)).not.toBeInTheDocument()
    expect(screen.queryByText('Sự kiện khác')).not.toBeInTheDocument()
    expect(localStorage.getItem('student-home-view')).toBe('list')
    fireEvent.click(screen.getByRole('button', { name: 'Bài viết' }))
    expect(screen.getByText(event.description)).toBeInTheDocument()
  })

  it('restores list mode with event links and registration actions', () => {
    localStorage.setItem('student-home-view', 'list')
    const view = renderHome()
    expect(screen.getByRole('button', { name: 'Danh sách' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getAllByRole('button', { name: 'Đăng ký ngay' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: `Xem sự kiện ${event.title}` })[0]).toHaveAttribute(
      'href',
      '/events/1'
    )
    // The initial preference is read again after returning to the home page.
    view.unmount()
    renderHome()
    expect(screen.getByRole('button', { name: 'Danh sách' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('shows only open-registration events on HomePage and hides status chips from HomePage filter', () => {
    const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
    client.setQueryData(['event-filter-options'], {
      academicYears: [],
      semesters: [],
      eventTypes: [],
      fanpages: [],
      criterias: [],
      pointCategories: [],
    })
    client.setQueryData(
      ['events', 'feed'],
      [
        {
          ...event,
          id: '10',
          title: 'Sự kiện đang mở ĐK',
          dateOpen: '2020-01-01T00:00:00Z',
          dateClose: '2099-01-01T00:00:00Z',
          startTime: '2099-02-01T08:00:00Z',
          endTime: '2099-02-01T11:00:00Z',
        },
        {
          ...event,
          id: '11',
          title: 'Sự kiện đã đóng ĐK',
          dateOpen: '2020-01-01T00:00:00Z',
          dateClose: '2021-01-01T00:00:00Z',
          startTime: '2099-02-01T08:00:00Z',
          endTime: '2099-02-01T11:00:00Z',
        },
        {
          ...event,
          id: '12',
          title: 'Sự kiện chưa mở ĐK',
          dateOpen: '2098-01-01T00:00:00Z',
          dateClose: '2099-01-01T00:00:00Z',
          startTime: '2099-02-01T08:00:00Z',
          endTime: '2099-02-01T11:00:00Z',
        },
        {
          ...event,
          id: '13',
          title: 'Sự kiện đã kết thúc',
          status: 'COMPLETED',
          startTime: '2021-02-01T08:00:00Z',
          endTime: '2021-02-01T11:00:00Z',
        },
        {
          ...event,
          id: '14',
          title: 'Sự kiện PUBLISHED quá hạn không có dateClose',
          status: 'PUBLISHED',
          dateClose: undefined,
          startTime: '2021-02-01T08:00:00Z',
          endTime: '2021-02-01T11:00:00Z',
        },
      ]
    )

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Sự kiện đang mở ĐK')).toBeInTheDocument()
    expect(screen.queryByText('Sự kiện đã đóng ĐK')).not.toBeInTheDocument()
    expect(screen.queryByText('Sự kiện chưa mở ĐK')).not.toBeInTheDocument()
    expect(screen.queryByText('Sự kiện đã kết thúc')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Sự kiện PUBLISHED quá hạn không có dateClose')
    ).not.toBeInTheDocument()

    // Status filter chips are hidden on HomePage (they belong to SearchPage)
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    expect(screen.queryByText('Trạng thái sự kiện')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đã kết thúc' })).not.toBeInTheDocument()
  })

  it('prioritizes recommended events in Discover tab and uses personalized recommendations in Recommended tab when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1' } as any })
    const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
    client.setQueryData(['event-filter-options'], {
      academicYears: [],
      semesters: [],
      eventTypes: [],
      fanpages: [],
      criterias: [],
      pointCategories: [],
    })
    const regularEvent: Event = {
      ...event,
      id: '20',
      title: 'Sự kiện thường mở đăng ký',
      isFollowed: false,
    }
    const recommendedEventA: Event = {
      ...event,
      id: '21',
      title: 'Sự kiện gợi ý ưu tiên số 1',
      recommendationExplain: 'Bổ sung +3 ĐRL mục V.b còn thiếu',
      recommendationScore: 95,
      isRecommended: true,
    }
    client.setQueryData(['events', 'feed'], [regularEvent, recommendedEventA])
    client.setQueryData(['events', 'recommendations', true], [recommendedEventA])

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // FeedTabs only renders "Khám phá" and "Đang theo dõi" (no standalone "Gợi ý" tab)
    expect(screen.getByRole('button', { name: 'Khám phá' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đang theo dõi' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gợi ý' })).not.toBeInTheDocument()

    // In Discover tab, recommendedEventA should appear before regularEvent in DOM order
    const headings = screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent)
    expect(headings).toEqual(['Sự kiện gợi ý ưu tiên số 1', 'Sự kiện thường mở đăng ký'])

    // Reason text is hidden until hovering/clicking the suggestion icon next to post timestamp
    expect(screen.queryByText('Bổ sung +3 ĐRL mục V.b còn thiếu')).not.toBeInTheDocument()
    const tipTrigger = screen.getByLabelText('Lý do gợi ý sự kiện')
    fireEvent.click(tipTrigger)
    expect(screen.getByText('Bổ sung +3 ĐRL mục V.b còn thiếu')).toBeInTheDocument()
  })

  it('formats backend recommendation explain into concise text naming the specific SV5T standard and DRL category', () => {
    const normalized = normalizeEvent({
      id: 3,
      name: 'Chiến dịch Chủ nhật Xanh',
      criteriaId: 402,
      criteriaName: 'Tham gia ít nhất 03 ngày tình nguyện trong năm học',
      status: 'PUBLISHED',
    })
    const formatted = formatRecommendationExplain(
      {
        explain:
          'Có thể bổ sung 3 điểm rèn luyện, có thể hoàn thành tiêu chí cấp trên, đến từ trang bạn theo dõi hoặc tham gia, cùng loại với sự kiện bạn đã đăng ký.',
        fulfillsCriteria: true,
        pointGains: [
          {
            categoryId: 2,
            categoryName: 'II. Trách nhiệm chấp hành pháp luật và nội quy',
            pointsOffered: 4,
            effectiveGain: 3,
          },
          {
            categoryId: 4,
            categoryName: 'IV. Trách nhiệm công dân trong quan hệ cộng đồng',
            pointsOffered: 5,
            effectiveGain: 0,
          },
        ],
      },
      normalized
    )
    expect(formatted).toBe('Bổ sung 3 điểm rèn luyện mục II, có thể hoàn thành tiêu chí Tình nguyện tốt.')

    const ethicsNormalized = normalizeEvent({
      id: 10,
      name: 'Sinh hoạt Công dân',
      criteriaId: 1033,
      status: 'PUBLISHED',
    })
    const ethicsFormatted = formatRecommendationExplain(
      {
        explain: 'có thể hoàn thành tiêu chí cấp trên, đến từ trang bạn theo dõi hoặc tham gia.',
        fulfillsCriteria: true,
        pointGains: [],
      },
      ethicsNormalized
    )
    expect(ethicsFormatted).toBe('Có thể hoàn thành tiêu chí Đạo đức tốt, từ trang bạn theo dõi.')
  })

  it('queues visible recommended cards via IntersectionObserver and flushes POST /events/views before refreshing recommendations', async () => {
    let observerCallback: IntersectionObserverCallback | null = null
    const observeMock = vi.fn()
    const unobserveMock = vi.fn()
    const disconnectMock = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback
        }
        observe = observeMock
        unobserve = unobserveMock
        disconnect = disconnectMock
      }
    )

    useAuthStore.setState({ isAuthenticated: true, user: { id: 'view-test-user' } as any })
    const callOrder: string[] = []
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async (url, body) => {
      callOrder.push(`POST ${url}`)
      expect(body).toMatchObject({ eventIds: [42] })
      return undefined as any
    })
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      callOrder.push(`GET ${url}`)
      if (url === '/events/recommendations') {
        return {
          content: [
            {
              event: {
                id: 42,
                name: 'Sự kiện vừa được xem',
                status: 'PUBLISHED',
                dateOpen: '2020-01-01T00:00:00Z',
                dateClose: '2099-01-01T00:00:00Z',
                dateHappen: '2099-02-01T08:00:00Z',
              },
              explain: 'Bổ sung 3 điểm rèn luyện',
              viewed: true,
              effectiveScore: 85,
              fulfillsCriteria: false,
            },
          ],
        } as any
      }
      return [] as any
    })

    const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
    client.setQueryData(['event-filter-options'], {
      academicYears: [],
      semesters: [],
      eventTypes: [],
      fanpages: [],
      criterias: [],
      pointCategories: [],
    })
    const unseenRecommended: Event = {
      ...event,
      id: '42',
      title: 'Sự kiện gợi ý mới',
      recommendationExplain: 'Bổ sung +3 ĐRL',
      isRecommended: true,
      isViewed: false,
    }
    const viewedRecommended: Event = {
      ...event,
      id: '57',
      title: 'Sự kiện gợi ý đã xem',
      recommendationExplain: 'Bổ sung +2 ĐRL',
      isRecommended: true,
      isViewed: true,
    }
    client.setQueryData(['events', 'feed'], [unseenRecommended, viewedRecommended])
    client.setQueryData(
      ['events', 'recommendations', true],
      [unseenRecommended, viewedRecommended]
    )

    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.queryByText('Đã xem')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Làm mới gợi ý' })).not.toBeInTheDocument()
    expect(observeMock).toHaveBeenCalledTimes(2)

    // Only card 42 entered viewport
    const card42 = document.querySelector('[data-event-id="42"]') as HTMLElement
    expect(card42).not.toBeNull()
    observerCallback!(
      [{ isIntersecting: true, target: card42 } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    )

    const queued = getPendingEventViewBatch('view-test-user')
    expect(queued?.eventIds).toEqual([42])

    // Leaving Home flushes POST /events/views and marks recommendations stale; returning fetches GET /events/recommendations
    view.unmount()
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1)
    })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/events/recommendations', expect.any(Object))
    })
    expect(callOrder.indexOf('POST /events/views')).toBeLessThan(
      callOrder.indexOf('GET /events/recommendations')
    )
    expect(getPendingEventViewBatch('view-test-user')).toBeNull()
  })
})
