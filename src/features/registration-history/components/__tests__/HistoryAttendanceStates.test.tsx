import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisteredEventCard } from '../RegisteredEventCard'
import { RegisteredEventTable } from '../RegisteredEventTable'
import { normalizeRegisteredEvent } from '../../services/historyService'
import { normalizeHistoryStatus } from '../../types/history.types'

vi.mock('@/shared', () => ({ apiClient: {}, formatEventTitle: (value: string) => value }))
afterEach(cleanup)

describe('real BE attendance statuses in history', () => {
  it.each(['card', 'table'])(
    'shows pending confirmation in %s without another upload or cancel action',
    (view) => {
      const row = normalizeRegisteredEvent({
        userId: 136,
        eventId: 12,
        status: 'SPENDING_CONFIRM',
        checkInEvidenceUrl: '/start.jpg',
        checkOutEvidenceUrl: '/end.jpg',
        eventInfo: { id: 12, name: 'Điểm danh ảnh' },
      })
      const props = {
        onOpenProofModal: vi.fn(),
        onOpenCancelModal: vi.fn(),
        onOpenAttendanceModal: vi.fn(),
      }
      render(
        <MemoryRouter>
          {view === 'card' ? (
            <RegisteredEventCard event={row} {...props} />
          ) : (
            <RegisteredEventTable events={[row]} {...props} />
          )}
        </MemoryRouter>
      )
      expect(screen.getAllByText('Chờ xác nhận').length).toBeGreaterThan(0)
      expect(
        screen.queryByRole('button', { name: /^Điểm danh$|Gửi ảnh cuối buổi|^Hủy/ })
      ).not.toBeInTheDocument()
      expect(row.checkOutEvidenceUrl).toBe('/end.jpg')
    }
  )
  it.each(['CONFIRMED', 'RECORDED'])(
    'keeps the %s BE state and counts it as completed',
    (status) => {
      const row = normalizeRegisteredEvent({
        eventId: 12,
        status,
        eventInfo: { id: 12 },
      })
      expect(row.status).toBe(status)
      expect(normalizeHistoryStatus(row.status)).toBe('COMPLETED')
      expect(row.canCancel).toBe(false)
    }
  )
})
