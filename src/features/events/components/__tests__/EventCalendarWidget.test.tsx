import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventCalendarWidget } from '../EventCalendarWidget'
import type { RegisteredEventItem } from '@/features/registration-history'

describe('EventCalendarWidget', () => {
  const initialMonth = new Date(2026, 9, 1) // October 2026

  it('renders correctly with empty registrations and displays NO dots', () => {
    const { container } = render(
      <EventCalendarWidget registeredEvents={[]} initialMonth={initialMonth} />
    )

    expect(screen.getByText('Tháng 10, 2026')).toBeInTheDocument()
    // No dots should exist in container
    const dots = container.querySelectorAll('[data-testid^="event-dot-"]')
    expect(dots.length).toBe(0)
  })

  it('renders dot ONLY on the date with a registered event', () => {
    const mockEvents: RegisteredEventItem[] = [
      {
        id: 'ev-1',
        eventId: 1,
        title: 'Hội thảo Trí tuệ Nhân tạo',
        dateHappen: '2026-10-25T08:00:00',
        status: 'UPCOMING',
        location: 'Hội trường Lớn',
        pointsCategory: 'ĐRL: +5',
        criteriaSv5t: 'Tiêu chuẩn 2',
        benefits: ['5 ĐRL'],
        extraBenefitsCount: 0,
        capacity: 100,
        registeredCount: 45,
        canCancel: true,
        canRequestAbsence: true,
        hasProof: false,
      },
    ]

    render(
      <EventCalendarWidget registeredEvents={mockEvents} initialMonth={initialMonth} />
    )

    // Dot on day 25 should be present
    const dot25 = screen.getByTestId('event-dot-25')
    expect(dot25).toBeInTheDocument()

    // No dot on day 8 or day 12 or day 23
    expect(screen.queryByTestId('event-dot-8')).toBeNull()
    expect(screen.queryByTestId('event-dot-12')).toBeNull()
    expect(screen.queryByTestId('event-dot-23')).toBeNull()
  })

  it('does NOT render dot for CANCELLED registrations', () => {
    const mockEvents: RegisteredEventItem[] = [
      {
        id: 'ev-2',
        eventId: 2,
        title: 'Sự kiện đã bị hủy tham gia',
        dateHappen: '2026-10-15T09:00:00',
        status: 'CANCELLED',
        location: 'Nhà thi đấu',
        pointsCategory: 'ĐRL: +3',
        criteriaSv5t: '',
        benefits: [],
        extraBenefitsCount: 0,
        capacity: 50,
        registeredCount: 10,
        canCancel: false,
        canRequestAbsence: false,
        hasProof: false,
      },
    ]

    render(
      <EventCalendarWidget registeredEvents={mockEvents} initialMonth={initialMonth} />
    )

    // Day 15 should NOT have a dot because registration is cancelled
    expect(screen.queryByTestId('event-dot-15')).toBeNull()
  })

  it('navigates between months when clicking previous and next buttons', () => {
    render(<EventCalendarWidget initialMonth={initialMonth} />)

    expect(screen.getByText('Tháng 10, 2026')).toBeInTheDocument()

    const nextBtn = screen.getByTitle('Tháng sau')
    fireEvent.click(nextBtn)
    expect(screen.getByText('Tháng 11, 2026')).toBeInTheDocument()

    const prevBtn = screen.getByTitle('Tháng trước')
    fireEvent.click(prevBtn)
    expect(screen.getByText('Tháng 10, 2026')).toBeInTheDocument()
  })

  it('calls onSelectDate when a date cell is clicked', () => {
    const onSelectDate = vi.fn()
    render(
      <EventCalendarWidget initialMonth={initialMonth} onSelectDate={onSelectDate} />
    )

    // Click day 20
    const day20 = screen.getByText('20')
    fireEvent.click(day20)

    expect(onSelectDate).toHaveBeenCalled()
    const calledDate: Date = onSelectDate.mock.calls[0][0]
    expect(calledDate.getDate()).toBe(20)
    expect(calledDate.getMonth()).toBe(9) // 0-indexed October
  })

  it('defaults to current month (today) when initialMonth is omitted', () => {
    const today = new Date()
    const expectedMonthLabel = `Tháng ${today.getMonth() + 1}, ${today.getFullYear()}`
    render(<EventCalendarWidget />)

    expect(screen.getByText(expectedMonthLabel)).toBeInTheDocument()
  })
})

