import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CriterionDetailModal } from '../CriterionDetailModal'
import type { PointTransaction } from '../../types/trainingPoints.types'
afterEach(cleanup)
const records: PointTransaction[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  userId: 1,
  semesterId: 2,
  pointCategoryId: 10,
  eventId: 100 + i,
  eventName: 'Sự kiện ' + (i + 1),
  eventDate: '2026-11-15T01:00:00Z',
  createdAt: '2026-11-17T01:00:00Z',
  points: 2,
  type: 'EVENT',
  status: 'CONFIRMED',
  description: '',
}))
const props = {
  isOpen: true,
  onClose: vi.fn(),
  criterionName: 'Tham gia tình nguyện',
  criteriaCode: 'III.a',
  maxPoints: 10,
  recordedTransactions: records,
  selfScore: 0,
  totalPoints: 10,
}
describe('training point evidence details', () => {
  it('lists every event with distinct dates and links even after reaching the score cap', () => {
    render(<CriterionDetailModal {...props} />)
    expect(screen.getAllByRole('article')).toHaveLength(12)
    expect(screen.getAllByRole('link', { name: 'Xem sự kiện' })).toHaveLength(12)
    expect(screen.getByText('Sự kiện 12')).toBeInTheDocument()
  })
  it('keeps occurrence and recording dates separate and shows capped progress', () => {
    render(<CriterionDetailModal {...props} recordedTransactions={[records[0]]} />)
    expect(screen.getByText('15/11/2026')).toBeInTheDocument()
    expect(screen.getByText('17/11/2026')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/events/100')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10')
  })
  it('does not invent an event name or link for an unlinked record', () => {
    render(
      <CriterionDetailModal
        {...props}
        recordedTransactions={[
          {
            ...records[0],
            eventId: null,
            eventName: undefined,
            eventDate: null,
            description: 'Event completion',
          },
        ]}
      />
    )
    expect(screen.getByText('Chưa xác định được hoạt động nguồn')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('Event completion')).not.toBeInTheDocument()
  })
  it('shows load failure and retry rather than an empty list', () => {
    const retry = vi.fn()
    render(<CriterionDetailModal {...props} recordedTransactions={[]} loadError onRetry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.queryByText('Chưa có hoạt động được ghi nhận.')).not.toBeInTheDocument()
  })
  it('closes on Escape and keeps self assessment below all system evidence', () => {
    const close = vi.fn()
    render(
      <CriterionDetailModal
        {...props}
        onClose={close}
        selfScore={3}
        manualTransactions={[{ ...records[0], type: 'MANUAL', description: 'Ghi chú riêng' }]}
      />
    )
    expect(screen.getByText(/Ghi chú riêng/)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
  })
})

describe('evidence status', () => {
  it('does not label pending or revoked records as confirmed', () => {
    render(
      <CriterionDetailModal
        {...props}
        recordedTransactions={[
          { ...records[0], status: 'PENDING' },
          { ...records[1], status: 'REVOKED' },
        ]}
      />
    )
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Đã thu hồi')).toBeInTheDocument()
    expect(screen.queryByText('Đã xác nhận')).not.toBeInTheDocument()
  })
})
