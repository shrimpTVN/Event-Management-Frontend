import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisteredEventCard } from '../RegisteredEventCard'
import { RegisteredEventTable } from '../RegisteredEventTable'

vi.mock('@/shared', () => ({ formatEventTitle: (value: string) => value }))
vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: () => true }))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('cancellation deadline in history', () => {
  it.each(['card', 'table'])('removes cancellation in %s as the deadline passes', (view) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-25T08:00:00+07:00'))
    const event = {
      id: '23', eventId: 23, status: 'REGISTERED',
      dateClose: '2026-11-25T08:00:01+07:00',
    }
    const props = { onOpenProofModal: vi.fn(), onOpenCancelModal: vi.fn() }
    render(
      <MemoryRouter>
        {view === 'card'
          ? <RegisteredEventCard event={event} {...props} />
          : <RegisteredEventTable events={[event]} {...props} />}
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /^Hủy/ })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1002))
    expect(screen.queryByRole('button', { name: /^Hủy/ })).not.toBeInTheDocument()
  })
})

describe('mobile history card benefit finalization', () => {
  it.each(['CONFIRMED', 'COMPLETED', 'RECORDED'])(
    'only reports recorded benefits after finalization for %s',
    (status) => {
      render(
        <MemoryRouter>
          <RegisteredEventCard
            event={{ id: '23', eventId: 23, title: 'Hiến máu', status }}
            onOpenProofModal={vi.fn()}
            onOpenCancelModal={vi.fn()}
          />
        </MemoryRouter>
      )

      if (status === 'RECORDED') {
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument()
        expect(screen.getByText(/Quyền lợi đã ghi nhận/)).toBeInTheDocument()
        expect(screen.queryByText(/Quyền lợi chờ chốt kết quả/)).not.toBeInTheDocument()
      } else {
        expect(screen.getByText('Chờ chốt kết quả')).toBeInTheDocument()
        expect(screen.getByText(/Quyền lợi chờ chốt kết quả/)).toBeInTheDocument()
        expect(screen.queryByText(/Quyền lợi đã ghi nhận/)).not.toBeInTheDocument()
      }
      expect(screen.getByRole('button', { name: 'Xem minh chứng' })).toBeInTheDocument()
    }
  )
})
