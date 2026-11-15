import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth'
import type { Event } from '@/features/events'
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
  client.setQueryData(
    ['events', 'feed'],
    [
      event,
      { ...event, id: '2', title: 'Sự kiện khác', description: 'Bài viết khác', isFollowed: false },
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
    localStorage.removeItem('student-home-view')
    useAuthStore.setState({ isAuthenticated: false, user: null })
  })
  afterEach(() => localStorage.removeItem('student-home-view'))

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
})
