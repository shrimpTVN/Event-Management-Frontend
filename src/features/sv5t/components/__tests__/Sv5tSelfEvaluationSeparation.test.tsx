import { sv5tService } from '../../services/sv5tService'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Sv5tRow } from '../Sv5tRow'
import { Sv5tDetailModal } from '../Sv5tDetailModal'
import type { CriteriaProgressNode } from '../../types/sv5t.types'

vi.mock('../../services/sv5tService', () => ({
  sv5tService: { getCriteriaTransactions: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('../Sv5tSelfEvaluationModal', () => ({
  Sv5tSelfEvaluationModal: ({
    isCompleted,
    currentNote,
  }: {
    isCompleted: boolean
    currentNote: string
  }) => (
    <div role="dialog">
      {isCompleted ? 'Tự chấm đạt' : 'Tự chấm chưa đạt'}
      {currentNote}
    </div>
  ),
}))

afterEach(cleanup)
const recordedNode: CriteriaProgressNode = {
  criteriaId: 403,
  isLeaf: true,
  isSystemCompleted: true,
  completionPercentage: 100,
  name: 'Hiến máu',
  scope: 'UNIVERSITY',
  level: 2,
  childrenOrder: 3,
  isCompleted: true,
  completedChildren: 0,
  totalChildren: 0,
  children: [],
  requiredOccurrences: 2,
  recordedOccurrences: 2,
  isSystemRecorded: true,
  completionSource: 'EVENT_CHECKOUT',
  isSelfEvaluated: false,
}

describe('system progress and manual evaluation UI', () => {
  it('shows 2/2 recorded while keeping the manual column and initial form unevaluated', () => {
    render(<Sv5tRow node={recordedNode} criteriaCode="4.3" isLeaf onSaveProgress={vi.fn()} />)
    expect(screen.getByText('2/2 lần · Đạt')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chưa đánh giá' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Tự chấm chưa đạt')
  })

  it('shows the student evaluation independently when both sources exist', () => {
    render(
      <Sv5tRow
        node={{ ...recordedNode, isSelfEvaluated: true, selfEvaluationNote: 'Ghi chú riêng' }}
        criteriaCode="4.3"
        isLeaf
        onSaveProgress={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đạt' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Tự chấm đạtGhi chú riêng')
  })

  it('opens a fresh self-evaluation from system-completed details without preselecting achieved', () => {
    const open = vi.fn()
    render(
      <Sv5tDetailModal
        isOpen
        onClose={vi.fn()}
        node={recordedNode}
        criteriaCode="4.3"
        onOpenSelfEvaluation={open}
      />
    )
    expect(screen.getByText('Chưa đánh giá')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tự đánh giá' }))
    expect(open).toHaveBeenCalledWith('', false)
  })

  it('keeps manual details visible alongside recorded events', () => {
    render(
      <Sv5tDetailModal
        isOpen
        onClose={vi.fn()}
        node={{ ...recordedNode, isSelfEvaluated: true, manualTransactionId: 47, selfEvaluationNote: 'Minh chứng riêng' }}
        criteriaCode="4.3"
        onOpenSelfEvaluation={vi.fn()}
      />
    )
    expect(screen.getByText('Minh chứng riêng')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chỉnh sửa tự chấm' })).toBeInTheDocument()
  })
})

it('lists both recorded donation activities rather than just the latest one', async () => {
  vi.mocked(sv5tService.getCriteriaTransactions).mockResolvedValueOnce([
    {
      id: 1,
      eventId: 51,
      eventName: 'Hiến máu - lần 1/2',
      completionSource: 'EVENT_CHECKOUT',
      createdAt: '2026-11-15T14:02:00Z',
    },
    {
      id: 2,
      eventId: 52,
      eventName: 'Hiến máu - lần 2/2',
      completionSource: 'EVENT_CHECKOUT',
      createdAt: '2026-11-15T14:17:00Z',
    },
    {
      id: 3,
      eventId: 52,
      eventName: 'Hiến máu - lần 2/2',
      completionSource: 'EVENT_CHECKOUT',
      createdAt: '2026-11-15T14:18:00Z',
    },
  ])
  render(
    <Sv5tDetailModal
      isOpen
      onClose={vi.fn()}
      node={recordedNode}
      academicYearId={7}
      criteriaCode="4.3"
    />
  )
  expect(await screen.findByText('Hiến máu - lần 1/2')).toBeInTheDocument()
  expect(screen.getAllByText('Hiến máu - lần 2/2')).toHaveLength(1)
  expect(screen.getByText('2/2 lần')).toBeInTheDocument()
  expect(sv5tService.getCriteriaTransactions).toHaveBeenCalledWith(403, 7)
})
it('reports failed details without claiming that the student has no activities', async () => {
  vi.mocked(sv5tService.getCriteriaTransactions).mockRejectedValueOnce(new Error('Unavailable'))
  render(
    <Sv5tDetailModal
      isOpen
      onClose={vi.fn()}
      node={recordedNode}
      academicYearId={7}
      criteriaCode="4.3"
    />
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được hoạt động ghi nhận.')
  expect(screen.queryByText('Chưa có hoạt động nào được ghi nhận.')).not.toBeInTheDocument()
})

it('labels the action as details and shows the requirement before activities', () => {
  render(<Sv5tRow node={recordedNode} criteriaCode="4.3" isLeaf onSaveProgress={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Xem' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }))
  expect(screen.getByRole('dialog', { name: 'Chi tiết tiêu chí 4.3' })).toBeInTheDocument()
  expect(screen.getByText('Điều kiện cần đạt')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Tiến độ ghi nhận' })).toHaveAttribute(
    'aria-valuenow',
    '2'
  )
})
it('shows event dates and recording dates separately and links to the real event', async () => {
  vi.mocked(sv5tService.getCriteriaTransactions).mockResolvedValueOnce([
    {
      id: 9,
      eventId: 23,
      eventName: 'Hiến máu lần 1',
      eventDate: '2026-11-15T01:00:00Z',
      createdAt: '2026-11-17T01:00:00Z',
      completionSource: 'EVENT_CHECKOUT',
    },
  ])
  render(
    <Sv5tDetailModal
      isOpen
      onClose={vi.fn()}
      node={recordedNode}
      criteriaCode="4.3"
      academicYearId={2}
    />
  )
  expect(await screen.findByText('Hiến máu lần 1')).toBeInTheDocument()
  expect(screen.getByText('15/11/2026')).toBeInTheDocument()
  expect(screen.getByText('17/11/2026')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Xem sự kiện' })).toHaveAttribute('href', '/events/23')
})
it('clearly identifies an unlinked record without inventing a name, date or link', async () => {
  vi.mocked(sv5tService.getCriteriaTransactions).mockResolvedValueOnce([
    {
      id: 65,
      eventId: null,
      eventName: null,
      eventDate: null,
      createdAt: '2026-11-11T06:30:00Z',
      completionSource: 'EVENT_CHECKOUT',
    },
  ])
  render(
    <Sv5tDetailModal
      isOpen
      onClose={vi.fn()}
      node={recordedNode}
      criteriaCode="1.3.3"
      academicYearId={2}
    />
  )
  expect(await screen.findByText('Chưa xác định được hoạt động nguồn')).toBeInTheDocument()
  expect(screen.getByText('Chưa có thông tin')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Xem sự kiện' })).not.toBeInTheDocument()
  expect(screen.queryByText('Hoạt động đã ghi nhận')).not.toBeInTheDocument()
})
it('closes on Escape', () => {
  const close = vi.fn()
  render(<Sv5tDetailModal isOpen onClose={close} node={recordedNode} criteriaCode="4.3" />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(close).toHaveBeenCalledOnce()
})
