import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StudentRightSidebar } from '../StudentRightSidebar'
const api = vi.hoisted(() => ({
  getSemesters: vi.fn(),
  getAcademicYears: vi.fn(),
  getSemesterPointGroupedTree: vi.fn(),
  getSemesterPointSummary: vi.fn(),
}))
vi.mock('@/features/training-points', () => ({ trainingPointsService: api }))
vi.mock('@/features/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: true, user: { id: 7 } }),
}))
vi.mock('@/features/registration-history', () => ({
  historyService: { getMyHistory: async () => [] },
}))
vi.mock('../EventCalendarWidget', () => ({ EventCalendarWidget: () => null }))
vi.mock('../DrlScoreGauge', () => ({
  DrlScoreGauge: ({ score, classification }: any) => (
    <div>
      {score}:{classification}
    </div>
  ),
}))
function mount() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <StudentRightSidebar />
      </MemoryRouter>
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  api.getSemesters.mockResolvedValue([{ id: 9, number: 1, status: 'ONGOING' }])
  api.getAcademicYears.mockResolvedValue([])
  api.getSemesterPointGroupedTree.mockResolvedValue([
    {
      id: 1,
      name: 'Root',
      maximum: 10,
      totalPoint: 15,
      isAtMaximum: true,
      completionPercentage: 100,
    },
  ])
  api.getSemesterPointSummary.mockResolvedValue({
    totalPoint: 81,
    maximum: 100,
    classificationLabel: 'Tốt',
    pointsNeeded: 9,
  })
})
afterEach(cleanup)
it('uses the backend summary and metadata rather than summing tree or reclassifying', async () => {
  mount()
  expect(await screen.findByText('81:Tốt')).toBeInTheDocument()
  expect(screen.getByText('10/10')).toBeInTheDocument()
  expect(screen.getByText('9 điểm')).toBeInTheDocument()
})
it('shows an error instead of claiming the maximum rank when summary fails', async () => {
  api.getSemesterPointSummary.mockRejectedValue(new Error('offline'))
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được điểm rèn luyện.')
  expect(screen.queryByText('Đã đạt mức xếp loại tối đa!')).not.toBeInTheDocument()
})
it('does not request a fallback semester when no semester is configured', async () => {
  api.getSemesters.mockResolvedValue([])
  mount()
  expect(await screen.findByText('Chưa có dữ liệu điểm rèn luyện.')).toBeInTheDocument()
  expect(api.getSemesterPointGroupedTree).not.toHaveBeenCalled()
  expect(api.getSemesterPointSummary).not.toHaveBeenCalled()
})
