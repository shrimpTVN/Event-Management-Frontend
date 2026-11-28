import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TrainingPointsPage from '../TrainingPointsPage'

const state = vi.hoisted(() => ({ ledger: [{ id: 42, points: 8 }], user: 7 }))
const services = vi.hoisted(() => ({
  getAcademicYears: vi.fn(),
  getSemesters: vi.fn(),
  getSemesterPointGroupedTree: vi.fn(),
  getSemesterPointSummary: vi.fn(),
  updatePointTransaction: vi.fn(),
  saveSelfEvaluation: vi.fn(),
  deletePointTransaction: vi.fn(),
}))
vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: any) => selector({ user: { id: state.user } }),
}))
vi.mock('@/features/events', () => ({ StudentLeftSidebar: () => null }))
vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: () => true }))
vi.mock('@/shared/hooks/useScrollActivity', () => ({ useScrollActivity: () => undefined }))
vi.mock('@/features/training-points', () => ({
  trainingPointsService: services,
  formatYearLabel: (value: string) => value,
  TrainingPointsNoticeBanner: () => null,
  TrainingPointsHeader: ({ onSemesterChange }: any) => (
    <button onClick={() => onSemesterChange('2')}>Semester 2</button>
  ),
  TrainingPointsSummary: ({ totalScore, classificationLabel, unavailable }: any) => (
    <div data-testid="summary">
      {unavailable ? 'unavailable' : `${totalScore}:${classificationLabel}`}
    </div>
  ),
  TrainingPointsTable: ({ sections, onSaveSelfScore, onDeleteSelfScore }: any) => (
    <div>
      <span data-testid="raw">{sections[0]?.totalPoint ?? 'empty'}</span>
      <button onClick={() => void onSaveSelfScore(2, 5, 'edited', 42)}>Edit 42</button>
      <button onClick={() => void onSaveSelfScore(2, 5, 'new')}>Add 5</button>
      <button onClick={() => void onDeleteSelfScore(43, 2)}>Delete 43</button>
    </div>
  ),
}))
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    ...render(
      <QueryClientProvider client={client}>
        <TrainingPointsPage />
      </QueryClientProvider>
    ),
    client,
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  state.ledger = [{ id: 42, points: 8 }]
  state.user = 7
  services.getAcademicYears.mockResolvedValue([{ id: 1, code: '2026-2027', isActive: true }])
  services.getSemesters.mockResolvedValue([
    { id: 9, number: 1, academicYearId: 1, status: 'ONGOING' },
    { id: 10, number: 2, academicYearId: 1, status: 'UPCOMING' },
  ])
  services.getSemesterPointGroupedTree.mockImplementation(async () => [
    {
      id: 1,
      maximum: 20,
      totalPoint: state.ledger.reduce((sum, t) => sum + t.points, 0),
      items: [],
    },
  ])
  // This deliberately differs from tree totals to catch FE hierarchy/classification recomputation.
  services.getSemesterPointSummary.mockResolvedValue({
    totalPoint: 81,
    maximum: 100,
    classificationLabel: 'Tốt từ BE',
    activitiesCount: 3,
  })
  services.updatePointTransaction.mockImplementation(async (id, points) => {
    state.ledger = state.ledger.map((t) => (t.id === id ? { ...t, points } : t))
  })
  services.saveSelfEvaluation.mockImplementation(async (payload) => {
    state.ledger.push({ id: 43, points: payload.points })
  })
  services.deletePointTransaction.mockImplementation(async (id) => {
    state.ledger = state.ledger.filter((t) => t.id !== id)
  })
})
afterEach(cleanup)
describe('TrainingPointsPage backend authority', () => {
  it('PATCHes the selected transaction and displays refetched values after reload', async () => {
    const view = mount()
    await screen.findByText('81:Tốt từ BE')
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('8'))
    fireEvent.click(screen.getByText('Edit 42'))
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('5'))
    expect(services.updatePointTransaction).toHaveBeenCalledWith(42, 5, 'edited')
    expect(services.saveSelfEvaluation).not.toHaveBeenCalled()
    view.unmount()
    mount()
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('5'))
  })
  it('POST adds instead of replacing and DELETE removes exactly the selected manual record', async () => {
    mount()
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('8'))
    fireEvent.click(screen.getByText('Add 5'))
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('13'))
    expect(services.saveSelfEvaluation).toHaveBeenCalledWith({
      semesterId: 9,
      pointCategoryId: 2,
      points: 5,
      description: 'new',
    })
    fireEvent.click(screen.getByText('Delete 43'))
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('8'))
    expect(services.deletePointTransaction).toHaveBeenCalledWith(43)
    expect(state.ledger).toEqual([{ id: 42, points: 8 }])
  })
  it('keeps a late response from the previous semester out of the selected semester', async () => {
    let resolveOld: (value: unknown) => void = () => undefined
    services.getSemesterPointGroupedTree.mockImplementation((id) =>
      id === 9
        ? new Promise((resolve) => {
            resolveOld = resolve
          })
        : Promise.resolve([{ id: 2, totalPoint: 19, items: [] }])
    )
    mount()
    await waitFor(() => expect(services.getSemesterPointGroupedTree).toHaveBeenCalledWith(9))
    fireEvent.click(screen.getByText('Semester 2'))
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('19'))
    resolveOld([{ id: 1, totalPoint: 99, items: [] }])
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('19'))
  })
  it('refetches under a different user key when the account changes', async () => {
    services.getSemesterPointGroupedTree.mockImplementation(async () => [
      { id: 1, totalPoint: state.user === 7 ? 8 : 2, items: [] },
    ])
    const view = mount()
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('8'))
    state.user = 8
    view.rerender(
      <QueryClientProvider client={view.client}>
        <TrainingPointsPage />
      </QueryClientProvider>
    )
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('2'))
    expect(view.client.getQueryData(['student-semester-points-tree', 7, 9])).toEqual([
      { id: 1, totalPoint: 8, items: [] },
    ])
  })
})
