import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RegistrationDeadline, useRegistrationDeadline } from '../RegistrationDeadline'

function Deadline({
  date = '2026-11-15T17:00:00',
  status,
  admin = false,
  registered = false,
}: {
  date?: string
  status?: string
  admin?: boolean
  registered?: boolean
}) {
  const info = useRegistrationDeadline(date, status)
  return <RegistrationDeadline info={info} isAdmin={admin} isRegistered={registered} />
}

describe('RegistrationDeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00'))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows a neutral deadline when more than a day remains', () => {
    render(<Deadline date="2026-11-20T18:00:00" />)
    expect(screen.getByText('Hạn 18:00 · 20/11')).toHaveClass('whitespace-nowrap')
  })

  it('highlights approaching deadlines and keeps the exact time in the tooltip', () => {
    render(<Deadline />)
    expect(screen.getByText('Còn 5 giờ')).toHaveClass('text-amber-700')
    fireEvent.mouseEnter(screen.getByText('Còn 5 giờ'))
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent('17:00')
    expect(screen.getByRole('tooltip')).toHaveTextContent('15/11/2026')
  })

  it('keeps the deadline muted for registered students', () => {
    render(<Deadline registered />)
    expect(screen.getByText('Hạn 17:00 · 15/11')).not.toHaveClass('text-amber-700')
    expect(screen.queryByText('Còn 5 giờ')).not.toBeInTheDocument()
  })

  it('automatically closes at the exact deadline and hides the old date for students', () => {
    render(<Deadline date="2026-11-15T12:00:30" />)
    expect(screen.getByText('Còn 1 phút')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByText('Đã đóng')).toBeInTheDocument()
    expect(screen.queryByText('12:00 · 15/11')).not.toBeInTheDocument()
  })

  it('retains the exact closing time for administrators without a strikethrough', () => {
    render(<Deadline status="CLOSED" admin />)
    expect(screen.getByText('Đã đóng · 15/11')).not.toHaveClass('line-through')
    fireEvent.mouseEnter(screen.getByText('Đã đóng · 15/11'))
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent('17:00')
  })

  it('handles closed events without a valid deadline', () => {
    render(<Deadline status="CLOSED" date="invalid" />)
    expect(screen.getByText('Đã đóng')).toBeInTheDocument()
  })
})
