import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Sv5tPage } from '../Sv5tPage'

const api = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), store: vi.fn() }))
vi.mock('@/features/events', () => ({ StudentLeftSidebar: () => null }))
vi.mock('@/features/auth', () => ({
  useAuthStore: (select: (value: unknown) => unknown) => select({ user: { id: 1 } }),
}))
vi.mock('@/features/sv5t', () => ({
  sv5tService: {
    getAcademicYears: async () => [{ id: 1, code: '2026-2027', isActive: true }],
    getStudentCriteriaProgress: async () => ({ criteria: [] }),
    getAllCriteriaTransactions: async () => [],
    toggleManualCriteriaProgress: api.save,
    deleteCriteriaTransaction: api.remove,
  },
  ensureSv5tHierarchy: () => [],
  getStoredEvaluations: () => ({ completedMap: {}, noteMap: {} }),
  setStoredEvaluations: api.store,
  Sv5tHeader: () => null,
  Sv5tNoticeBanner: () => null,
  Sv5tSummary: () => null,
  Sv5tRegulationModal: () => null,
  Sv5tTable: ({
    onSaveProgress,
    onDeleteProgress,
  }: {
    onSaveProgress: (id: number, completed: boolean, note: string) => Promise<void>
    onDeleteProgress: (transaction: number, id: number) => Promise<void>
  }) => {
    const [result, setResult] = useState('')
    const run = (operation: Promise<void>) =>
      void operation.then(() => setResult('Đã lưu')).catch(() => setResult('Lưu thất bại'))
    return (
      <>
        <button onClick={() => run(onSaveProgress(402, true, 'Minh chứng'))}>Lưu</button>
        <button onClick={() => run(onDeleteProgress(1, 402))}>Xóa</button>
        <p role="status">{result}</p>
      </>
    )
  },
}))

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <Sv5tPage />
    </QueryClientProvider>
  )
  return client
}
it.each(['Lưu', 'Xóa'])(
  'does not persist a failed %s and propagates the failure to the dialog',
  async (action) => {
    api.save.mockRejectedValue(new Error('offline'))
    api.remove.mockRejectedValue(new Error('offline'))
    const client = mount()
    await waitFor(() => expect(client.getQueryData(['academic-years'])).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: action }))
    await screen.findByText('Lưu thất bại')
    expect(api.store).not.toHaveBeenCalled()
  }
)
it('persists the evaluation only after the server accepts it', async () => {
  let resolve!: () => void
  api.save.mockImplementation(
    () =>
      new Promise<void>((done) => {
        resolve = done
      })
  )
  const client = mount()
  await waitFor(() => expect(client.getQueryData(['academic-years'])).toBeDefined())
  fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
  expect(api.store).not.toHaveBeenCalled()
  await waitFor(() => expect(resolve).toBeTypeOf('function'))
  resolve()
  await screen.findByText('Đã lưu')
  expect(api.store).toHaveBeenCalledWith(1, 1, {
    completedMap: { 402: true },
    noteMap: { 402: 'Minh chứng' },
  })
})
