import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventFeedCard } from '../EventFeedCard'
import type { Event } from '../../types/event.types'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => false) }))

describe('EventFeedCard', () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(false)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  const mockEvent: Event = {
    id: 'ev-101',
    title: 'Workshop: Kỹ năng viết CV và phỏng vấn thành công',
    description: 'Học cách trình bày CV ấn tượng, xây dựng portfolio GitHub...',
    category: 'WORKSHOP',
    status: 'PUBLISHED',
    startTime: '2026-10-08T07:00:00',
    endTime: '2026-10-08T09:00:00',
    location: {
      type: 'OFFLINE',
      address: 'Phòng Lab 3',
      city: 'Trường CNTT&TT',
    },
    capacity: 80,
    registeredCount: 30,
    price: 0,
    organizerId: 'fanpage-99',
    organizerName: 'Đoàn Trường CNTT & TT',
    organizerAvatarUrl: 'https://example.com/avatar.jpg',
    pointsReward: '+3 Điểm rèn luyện',
    isModerationRequired: false,
    createdAt: '2026-10-01T00:00:00',
    updatedAt: '2026-10-01T00:00:00',
  }

  it('offers follow and save in the phone post menu and closes after an action', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    const follow = vi.fn()
    const save = vi.fn()
    renderWithProviders(
      <EventFeedCard event={mockEvent} onToggleFollow={follow} onToggleSave={save} />
    )
    expect(screen.queryByRole('button', { name: 'Theo dõi' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tùy chọn bài viết' }))
    fireEvent.click(screen.getByRole('button', { name: 'Theo dõi fanpage' }))
    expect(follow).toHaveBeenCalledWith(mockEvent.organizerId)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tùy chọn bài viết' }))
    expect(screen.getByRole('button', { name: 'Bỏ theo dõi fanpage' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sự kiện' }))
    expect(save).toHaveBeenCalledWith(mockEvent.id)
  })

  it('renders fanpage name and avatar as links navigating to /fanpage/:id', () => {
    renderWithProviders(<EventFeedCard event={mockEvent} />)

    // Both avatar link and name link should navigate to /fanpage/:id
    const links = screen.getAllByRole('link', { name: /Đoàn Trường CNTT & TT/i })
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/fanpage/fanpage-99')
    })
  })

  it('keeps the phone verification badge inline with the fanpage name and uses status badge with detail action', () => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    renderWithProviders(
      <EventFeedCard
        event={{
          ...mockEvent,
          status: 'CLOSED',
          eventTypeName: 'Workshop',
          startTime: '2026-11-20T07:00:00',
          endTime: '2026-11-20T09:00:00',
          organizerFullName: 'Đoàn Thanh niên - Hội Sinh viên Trường Đại học Cần Thơ',
        }}
      />
    )
    const author = screen.getAllByRole('link', { name: /Đoàn Thanh niên - Hội Sinh viên/ })[1]
    expect(author.querySelector('img[alt="Đã xác thực"]')).toBeInTheDocument()
    expect(screen.getByText('Đã đóng đăng ký')).toBeInTheDocument()
    const labels = screen.getByRole('group', { name: 'Thể loại và trạng thái sự kiện' })
    expect(within(labels).getByText('Workshop')).toBeInTheDocument()
    expect(within(labels).getByText('Đã đóng đăng ký')).toBeInTheDocument()
    expect(screen.getAllByText('Workshop')).toHaveLength(1)
    expect(screen.getAllByText('Đã đóng đăng ký')).toHaveLength(1)
    const action = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(action).toBeInTheDocument()
  })

  it('falls back to /fanpage/1 if organizerId is missing', () => {
    const eventWithoutOrgId = { ...mockEvent, organizerId: '' }
    renderWithProviders(<EventFeedCard event={eventWithoutOrgId} />)

    const links = screen.getAllByRole('link', { name: /Đoàn Trường CNTT & TT/i })
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/fanpage/1')
    })
  })

  it('renders event type badge on poster and registration close date to the left of bookmark', () => {
    const eventWithDetails: Event = {
      ...mockEvent,
      bannerUrl: 'https://example.com/poster.jpg',
      eventTypeName: 'Workshop',
      dateClose: '2026-11-20T23:59:00',
    }
    renderWithProviders(<EventFeedCard event={eventWithDetails} />)

    // Event type badge
    expect(screen.getByText('Workshop')).toBeInTheDocument()

    // Registration close info
    expect(screen.getByText('Hạn 23:59 · 20/11')).toBeInTheDocument()
    expect(screen.getByText(/23:59/)).toBeInTheDocument()
    expect(screen.getByText(/20\/11/)).toBeInTheDocument()
  })

  it('renders event type chip above title when event has no banner', () => {
    const eventWithoutBanner: Event = {
      ...mockEvent,
      bannerUrl: undefined,
      eventTypeName: 'Thể thao',
    }
    renderWithProviders(<EventFeedCard event={eventWithoutBanner} />)

    expect(screen.getByText('Thể thao')).toBeInTheDocument()
  })

  it('shows closed registration rather than full when a closed event still has seats', () => {
    renderWithProviders(<EventFeedCard event={{ ...mockEvent, status: 'CLOSED' }} />)
    expect(screen.getByRole('button', { name: 'Đã đóng đăng ký' })).toBeDisabled()
    expect(screen.queryByText('Hết lượt đăng ký')).not.toBeInTheDocument()
  })

  it('shows full only when an open event reaches capacity', () => {
    renderWithProviders(<EventFeedCard event={{ ...mockEvent, registeredCount: 80 }} />)
    expect(screen.getByRole('button', { name: 'Đã đủ chỗ' })).toBeDisabled()
  })

  it('keeps saved state while switching between list and post views', () => {
    const onSave = vi.fn()
    const view = (variant: 'post' | 'list') => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EventFeedCard event={mockEvent} variant={variant} onToggleSave={onSave} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    const rendered = render(view('list'))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sự kiện' }))
    expect(onSave).toHaveBeenCalledWith(mockEvent.id)
    rendered.rerender(view('post'))
    rendered.rerender(view('list'))
    expect(screen.getByRole('button', { name: 'Bỏ lưu sự kiện' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('keeps the registered action available after registration closes', () => {
    renderWithProviders(
      <EventFeedCard event={{ ...mockEvent, status: 'CLOSED', isRegistered: true }} />
    )
    expect(screen.getByRole('button', { name: 'Đã đăng ký' })).not.toBeDisabled()
  })

  it('shows the major SV5T criterion and selected child without the label prefix', () => {
    queryClient.setQueryData(
      ['sv5tCriterias'],
      [
        {
          id: 100,
          name: 'Danh hiệu Sinh viên 5 tốt',
          children: [
            {
              id: 1,
              name: 'Tiêu chuẩn Tình nguyện tốt',
              childrenOrder: 4,
              children: [{ id: 2, name: 'Hiến máu', childrenOrder: 3 }],
            },
          ],
        },
      ]
    )
    renderWithProviders(
      <EventFeedCard
        event={{
          ...mockEvent,
          criteriaId: 2,
          criteriaName: 'Hiến máu',
          bannerUrl: 'https://example.com/poster.jpg',
          pointsReward: '+3 Điểm rèn luyện · Tiêu chuẩn SV5T: Hiến máu',
        }}
      />
    )
    fireEvent.mouseEnter(screen.getByText('Xét Tình nguyện tốt (4.3)'))
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^4\.3\. Hiến máu$/)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText(/Tiêu chuẩn SV5T:/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: mockEvent.title }))
    const labels = screen.getAllByText('Xét Tình nguyện tốt (4.3)')
    expect(labels).toHaveLength(2)
    fireEvent.mouseEnter(labels[1])
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^4\.3\. Hiến máu$/)
    queryClient.removeQueries({ queryKey: ['sv5tCriterias'] })
  })
})
