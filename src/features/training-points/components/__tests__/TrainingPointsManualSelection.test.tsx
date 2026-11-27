import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TrainingPointsRow } from '../TrainingPointsRow'
import { trainingPointsService } from '../../services/trainingPointsService'

vi.mock('../../services/trainingPointsService', () => ({
  trainingPointsService: { getPointTransactionsByCategory: vi.fn() },
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('opens the selected manual points rather than the aggregate and deletes the selected ID', async () => {
  vi.mocked(trainingPointsService.getPointTransactionsByCategory).mockResolvedValue([
    {
      id: 42,
      points: 8,
      type: 'MANUAL',
      status: 'PENDING',
      description: 'First',
      createdAt: '2026-11-27',
    },
    {
      id: 43,
      points: 5,
      type: 'MANUAL',
      status: 'REJECTED',
      description: 'Second',
      createdAt: '2026-11-27',
    },
  ] as any)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const save = vi.fn(),
    remove = vi.fn()
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TrainingPointsRow
        item={
          {
            id: 2,
            name: 'Leaf',
            maximum: 20,
            level: 1,
            totalPoint: 13,
            isAtMaximum: false,
            completionPercentage: 65,
          } as any
        }
        criteriaCode="I.1"
        recordedPoints={0}
        selfScore={13}
        isLeaf
        semesterId={9}
        onSaveSelfScore={save}
        onDeleteSelfScore={remove}
      />
    </QueryClientProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chi tiết điểm và minh chứng' }))
  const second = await screen.findByText(/điểm · Second/)
  const row = second.parentElement!
  fireEvent.click(within(row).getByRole('button', { name: /Sửa ghi nhận/ }))
  expect(screen.getByRole('spinbutton', { name: 'Số điểm tự chấm' })).toHaveValue(5)
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Số điểm tự chấm' }), {
    target: { value: '4' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith(2, 4, 'Second', 43))
  await waitFor(() => expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Chi tiết điểm và minh chứng' }))
  const first = await screen.findByText(/điểm · First/)
  fireEvent.click(within(first.parentElement!).getByRole('button', { name: /Xóa/ }))
  await waitFor(() => expect(remove).toHaveBeenCalledWith(42, 2))
})
