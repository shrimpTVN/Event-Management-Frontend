import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventFeedCard } from '../EventFeedCard'
import type { Event } from '../../types/event.types'

describe('EventFeedCard', () => {
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

  it('renders fanpage name and avatar as links navigating to /fanpage/:id', () => {
    renderWithProviders(<EventFeedCard event={mockEvent} />)

    // Both avatar link and name link should navigate to /fanpage/:id
    const links = screen.getAllByRole('link', { name: /Đoàn Trường CNTT & TT/i })
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/fanpage/fanpage-99')
    })
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
})
