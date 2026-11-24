import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminStatisticsDashboard } from '../AdminStatisticsDashboard'
import { adminStatisticsService } from '../../services/adminStatisticsService'
import { adminDashboard } from '../../services/__tests__/fixtures/adminDashboard'
vi.mock('../../services/adminStatisticsService', () => ({ adminStatisticsService: { getDashboard: vi.fn() } }))
vi.mock('@/components/ui/EChartsReact', () => ({ EChartsReact: () => <div data-testid="chart" /> }))
beforeEach(() => { vi.resetAllMocks(); HTMLElement.prototype.scrollIntoView = vi.fn() })
function show() {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminStatisticsDashboard semesters={[{ id: 9, number: 1, academicYear: '2026-2027', startDate: '', endDate: '', status: 'ONGOING', isCurrent: true, isActive: true }]} pendingFanpages={[]} violatedEvents={[]} onNavigateTab={vi.fn()} onReviewFanpage={vi.fn()} onModerateEvent={vi.fn()} /></QueryClientProvider></MemoryRouter>)
}
it('uses API metrics rather than empty management lists and refetches for the selected semester', async () => {
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(adminDashboard)
  show()
  expect(await screen.findByText('42')).toBeInTheDocument()
  expect(screen.getByText('Fanpage chờ duyệt (1)')).toBeInTheDocument()
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Học kỳ thống kê hệ thống' }), { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: 'HK1 · 2026-2027' }))
  await waitFor(() => expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith(new Date().getFullYear(), '9'))
})
it('shows an error and retry rather than replacing a failed dashboard with zero counts', async () => {
  vi.mocked(adminStatisticsService.getDashboard).mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValueOnce(adminDashboard)
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thống kê hệ thống')
  expect(screen.queryByText('42')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByText('42')).toBeInTheDocument()
})
