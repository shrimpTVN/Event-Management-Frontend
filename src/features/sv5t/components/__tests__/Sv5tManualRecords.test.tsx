import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { Sv5tDetailModal } from '../Sv5tDetailModal'
import { Sv5tRow } from '../Sv5tRow'
import { sv5tService } from '../../services/sv5tService'
import type { CriteriaProgressNode } from '../../types/sv5t.types'

const viewport = vi.hoisted(() => ({ mobile: false }))
vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: () => viewport.mobile }))
vi.mock('../../services/sv5tService', () => ({
  sv5tService: { getCriteriaTransactions: vi.fn() },
}))
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
const node: CriteriaProgressNode = {
  criteriaId: 403,
  name: 'Hiến máu',
  scope: 'UNIVERSITY',
  level: 2,
  childrenOrder: 3,
  requiredOccurrences: 3,
  recordedOccurrences: 2,
  isCompleted: false,
  isLeaf: true,
  completedChildren: 0,
  totalChildren: 0,
  isSelfEvaluated: true,
  manualTransactionId: 48,
  selfEvaluationNote: 'Lần thứ hai',
  completionPercentage: 66,
  children: [],
}
const records = [
  { id: 48, note: 'Lần thứ hai', completionSource: 'MANUAL', createdAt: '2026-11-26T03:00:00Z' },
  { id: 46, note: 'Lần thứ nhất', completionSource: 'MANUAL', createdAt: '2026-11-25T03:00:00Z' },
]
beforeEach(() => {
  viewport.mobile = false
  vi.mocked(sv5tService.getCriteriaTransactions).mockResolvedValue(records)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('renders each manual record once with its own date and edit/delete controls', async () => {
  const edit = vi.fn()
  const remove = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(
    <Sv5tDetailModal
      isOpen
      onClose={vi.fn()}
      node={node}
      criteriaCode="4.3"
      academicYearId={7}
      onOpenSelfEvaluation={edit}
      onDeleteManualTransaction={remove}
    />
  )
  await screen.findByText('Lần thứ nhất')
  const section = screen.getByRole('region', { name: 'Sinh viên tự đánh giá' })
  expect(within(section).getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getAllByText('Lần thứ hai')).toHaveLength(1)
  expect(screen.getAllByText('Lần thứ nhất')).toHaveLength(1)
  expect(within(section).getAllByRole('button', { name: 'Chỉnh sửa tự chấm' })).toHaveLength(2)
  expect(within(section).getAllByRole('button', { name: 'Xóa tự chấm' })).toHaveLength(2)
  expect(screen.getByText('Ngày ghi nhận 26/11/2026')).toBeInTheDocument()
  expect(screen.getByText('Ngày ghi nhận 25/11/2026')).toBeInTheDocument()
  expect(screen.queryByText(/Sửa ghi nhận /)).not.toBeInTheDocument()
  expect(screen.queryByText('Tự đánh giá đạt')).not.toBeInTheDocument()
  expect(screen.getByText('Chưa đạt tiêu chí')).toBeInTheDocument()
  const first = within(section).getAllByRole('listitem')[0]
  fireEvent.click(within(first).getByRole('button', { name: 'Chỉnh sửa tự chấm' }))
  expect(edit).toHaveBeenCalledWith('Lần thứ hai', true, 48)
  const second = within(section).getAllByRole('listitem')[1]
  fireEvent.click(within(second).getByRole('button', { name: 'Xóa tự chấm' }))
  await waitFor(() => expect(remove).toHaveBeenCalledWith(46, 403))
})

it.each([false, true])(
  'shows unfinished manual progress using BE isCompleted on mobile=%s',
  (mobile) => {
    viewport.mobile = mobile
    render(<Sv5tRow node={node} criteriaCode="4.3" isLeaf onSaveProgress={vi.fn()} />)
    expect(screen.getByText('Chưa đạt')).toBeInTheDocument()
    expect(screen.queryByText('Đạt')).not.toBeInTheDocument()
    expect(screen.getByText('2/3 lần')).toBeInTheDocument()
  }
)

it('uses the BE status even when counters alone would suggest achievement', () => {
  render(
    <Sv5tRow
      node={{ ...node, recordedOccurrences: 3, isCompleted: false }}
      criteriaCode="4.3"
      isLeaf
      onSaveProgress={vi.fn()}
    />
  )
  expect(screen.getByText('Chưa đạt')).toBeInTheDocument()
  expect(screen.getByText('3/3 lần')).toBeInTheDocument()
  expect(screen.queryByText('Đạt')).not.toBeInTheDocument()
})

it('saves a manual reason without asking the student to choose an achieved status', async () => {
  const { Sv5tSelfEvaluationModal } = await import('../Sv5tSelfEvaluationModal')
  const save = vi.fn().mockResolvedValue(undefined)
  render(
    <Sv5tSelfEvaluationModal
      isOpen
      onClose={vi.fn()}
      criterionName="Hiến máu"
      criteriaCode="4.3"
      isCompleted={false}
      onSave={save}
    />
  )
  expect(screen.queryByRole('button', { name: 'Đạt' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Chưa đạt' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hiến máu lần 1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith(true, 'Hiến máu lần 1'))
})
