import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventFeedCard } from '../EventFeedCard'
import type { Event } from '../../types/event.types'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => true) }))

describe('EventFeedCard on Mobile (Facebook feed style)', () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  const baseEvent: Event = {
    id: 'ev-201',
    title: 'Hội thảo Trí tuệ Nhân tạo và Xu hướng Công nghệ 2026',
    description: 'Khám phá các mô hình AI mới nhất tại https://example.com và học cách áp dụng vào thực tế.',
    category: 'WORKSHOP',
    eventTypeName: 'Hội thảo',
    status: 'PUBLISHED',
    startTime: '2026-11-20T08:00:00',
    endTime: '2026-11-20T11:00:00',
    dateClose: '2026-11-19T23:59:00',
    location: {
      type: 'OFFLINE',
      address: 'Hội trường lớn',
      city: 'Khu II - ĐHCT',
    },
    capacity: 150,
    registeredCount: 45,
    price: 0,
    organizerId: 'fanpage-10',
    organizerName: 'CLB Trí tuệ Nhân tạo',
    organizerAvatarUrl: 'https://example.com/ai-club.jpg',
    pointsReward: '+5 Điểm rèn luyện',
    bannerUrl: 'https://example.com/ai-banner.jpg',
    isModerationRequired: false,
    createdAt: '2026-11-01T00:00:00',
    updatedAt: '2026-11-01T00:00:00',
  }

  it('renders Facebook-style layout: Header -> Description -> Poster -> Info box with title below poster -> Full-width CTA', () => {
    renderWithProviders(<EventFeedCard event={baseEvent} />)

    // 1. Header has circular avatar and organizer name with verified badge
    const organizerLinks = screen.getAllByRole('link', { name: /CLB Trí tuệ Nhân tạo/i })
    expect(organizerLinks[0]).toHaveAttribute('href', '/fanpage/fanpage-10')

    // 2. Safe link in description is rendered as anchor
    const linkInDesc = screen.getByRole('link', { name: 'https://example.com' })
    expect(linkInDesc).toHaveAttribute('href', 'https://example.com')

    // 3. Image is rendered without desktop overlay badges on mobile
    const posterImg = screen.getByAltText(baseEvent.title)
    expect(posterImg).toBeInTheDocument()
    expect(screen.queryByText('Không giới hạn')).not.toBeInTheDocument()

    // 4. Title is placed in the info box below the poster
    const titleLink = screen.getByRole('link', { name: baseEvent.title })
    expect(titleLink).toHaveAttribute('href', '/events/ev-201')

    // 5. Open registration shows full-width "Đăng ký tham gia" CTA
    const registerBtn = screen.getByRole('button', { name: 'Đăng ký tham gia' })
    expect(registerBtn).toBeInTheDocument()
    expect(registerBtn).toHaveClass('w-full')
  })

  it('shows "Xem đăng ký" button when user is already registered', () => {
    renderWithProviders(<EventFeedCard event={{ ...baseEvent, isRegistered: true }} />)

    // Small status badge says "Đã đăng ký"
    expect(screen.getByText('Đã đăng ký')).toBeInTheDocument()

    // Main action button is "Xem đăng ký"
    const viewRegBtn = screen.getByRole('button', { name: 'Xem đăng ký' })
    expect(viewRegBtn).toBeInTheDocument()
    expect(viewRegBtn).toHaveClass('w-full')
  })

  it('shows "Đã đóng đăng ký" badge and "Xem chi tiết" button when registration deadline passed', () => {
    renderWithProviders(
      <EventFeedCard
        event={{
          ...baseEvent,
          status: 'CLOSED_REGISTRATION',
          startTime: '2026-11-20T08:00:00',
          endTime: '2026-11-20T11:00:00',
        }}
      />
    )

    expect(screen.getByText('Đã đóng đăng ký')).toBeInTheDocument()
    const detailBtn = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(detailBtn).toBeInTheDocument()
  })

  it('shows "Đã đủ chỗ" badge and "Xem chi tiết" button when capacity is reached', () => {
    renderWithProviders(
      <EventFeedCard
        event={{
          ...baseEvent,
          capacity: 100,
          registeredCount: 100,
        }}
      />
    )

    expect(screen.getByText('Đã đủ chỗ')).toBeInTheDocument()
    const detailBtn = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(detailBtn).toBeInTheDocument()
  })

  it('shows "Đã kết thúc" badge and "Xem chi tiết" button when event ended', () => {
    renderWithProviders(
      <EventFeedCard
        event={{
          ...baseEvent,
          startTime: '2026-11-10T08:00:00',
          endTime: '2026-11-10T11:00:00', // Past event compared to 2026-11-15
        }}
      />
    )

    expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    const detailBtn = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(detailBtn).toBeInTheDocument()
  })

  it('shows "Đã hủy" badge and "Xem chi tiết" button when event is cancelled', () => {
    renderWithProviders(
      <EventFeedCard
        event={{
          ...baseEvent,
          status: 'CANCELLED',
        }}
      />
    )

    expect(screen.getByText('Đã hủy')).toBeInTheDocument()
    const detailBtn = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(detailBtn).toBeInTheDocument()
  })

  it('clicking the poster image opens EventPhotoViewerModal without navigating to event details', () => {
    renderWithProviders(<EventFeedCard event={baseEvent} />)

    const photoButton = screen.getByRole('button', { name: 'Xem ảnh sự kiện to rõ' })
    fireEvent.click(photoButton)

    // EventPhotoViewerModal opens with close button
    expect(screen.getByRole('button', { name: 'Đóng xem ảnh' })).toBeInTheDocument()
  })
})
