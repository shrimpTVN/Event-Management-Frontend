import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ProofModal } from '../ProofModal'
import { normalizeRegisteredEvent } from '../../services/historyService'

const { account } = vi.hoisted(() => ({
  account: {
    user: { id: '11', name: 'Nguyễn An', studentId: 'B123' } as {
      id: string
      name: string
      studentId: string
    } | null,
  },
}))
vi.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: typeof account) => unknown) => selector(account),
}))
vi.mock('@/shared', () => ({ apiClient: {}, formatEventTitle: (title: string) => title }))
afterEach(() => {
  cleanup()
  account.user = { id: '11', name: 'Nguyễn An', studentId: 'B123' }
})

describe('student proof uses real attendance information', () => {
  it('preserves both actor IDs from BE and displays Vietnam dates across midnight without invented sessions', () => {
    const event = normalizeRegisteredEvent({
      userId: 11,
      eventId: 17,
      status: 'COMPLETED',
      checkInAt: '2026-11-14T16:56:08.873427Z',
      checkOutAt: '2026-11-14T17:05:00Z',
      checkInBy: 2,
      checkOutBy: 3,
      eventInfo: { id: 17, name: 'Điểm danh thủ công' },
    })
    expect(event.checkInBy).toBe(2)
    expect(event.checkOutBy).toBe(3)
    expect(event.attendanceSessions).toEqual([])
    render(<ProofModal isOpen onClose={vi.fn()} event={event} />)
    expect(screen.getByText('Nguyễn An · B123')).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('23:56 · 14/11/2026')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Tài khoản #2')).toBeInTheDocument()
    expect(within(rows[2]).getByText('00:05 · 15/11/2026')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Tài khoản #3')).toBeInTheDocument()
    expect(
      screen.queryByText(/Hệ thống tự động|Buổi chính|Hợp lệ|Đoàn Tài Lộc/)
    ).not.toBeInTheDocument()
  })

  it('identifies self attendance and does not invent a checkout or missing actor', () => {
    const event = normalizeRegisteredEvent({
      userId: 11,
      eventId: 18,
      status: 'SELF_CHECKED_IN',
      checkInAt: '2026-11-14T01:00:00Z',
      checkInBy: 11,
      checkInEvidenceUrl: '/start.jpg',
      eventInfo: { id: 18 },
    })
    render(<ProofModal isOpen onClose={vi.fn()} event={event} />)
    expect(screen.getByText('Bạn')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem ảnh Check-in' })).toHaveAttribute(
      'href',
      '/start.jpg'
    )
    expect(screen.queryByRole('link', { name: 'Xem ảnh Check-out' })).not.toBeInTheDocument()
    expect(within(screen.getAllByRole('row')[2]).getAllByText('—')).toHaveLength(2)
  })

  it('does not attach the logged-in identity to another registration and handles invalid timestamps honestly', () => {
    const event = normalizeRegisteredEvent({
      userId: 99,
      eventId: 18,
      status: 'COMPLETED',
      checkInAt: 'invalid',
      eventInfo: { id: 18 },
    })
    const onClose = vi.fn()
    render(<ProofModal isOpen onClose={onClose} event={event} />)
    expect(screen.queryByText(/Nguyễn An|B123|Đoàn Tài Lộc|B2303827/)).not.toBeInTheDocument()
    expect(screen.queryByText('invalid')).not.toBeInTheDocument()
    expect(screen.getByText('Chưa có thông tin')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
