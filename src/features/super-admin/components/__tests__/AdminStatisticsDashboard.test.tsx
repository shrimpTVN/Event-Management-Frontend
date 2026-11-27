import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminStatisticsDashboard } from '../AdminStatisticsDashboard'
import { adminStatisticsService } from '../../services/adminStatisticsService'
import type { SuperAdminSemester } from '../../types/superAdmin.types'
import { adminDashboard } from '../../services/__tests__/fixtures/adminDashboard'
vi.mock('../../services/adminStatisticsService', () => ({
  adminStatisticsService: { getDashboard: vi.fn(), getAcademicYears: vi.fn() },
}))
vi.mock('@/components/ui/EChartsReact', () => ({
  EChartsReact: ({ option }: { option: any }) => (
    <div data-testid="chart" data-option={JSON.stringify(option)} />
  ),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(adminStatisticsService.getAcademicYears).mockResolvedValue([
    { id: 1, code: '2026-2027', isActive: true },
  ])
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
function show(semesters?: SuperAdminSemester[]) {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AdminStatisticsDashboard
          semesters={
            semesters ?? [
              {
                id: 9,
                academicYearId: 1,
                number: 1,
                academicYear: '2026-2027',
                startDate: '',
                endDate: '',
                status: 'ONGOING',
                isCurrent: true,
                isActive: true,
              },
            ]
          }
          pendingFanpages={[]}
          onNavigateTab={vi.fn()}
          onReviewFanpage={vi.fn()}
        />
      </QueryClientProvider>
    </MemoryRouter>
  )
}
it('uses API metrics rather than empty management lists and refetches for the selected semester', async () => {
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(adminDashboard)
  show()
  expect(await screen.findByText('42')).toBeInTheDocument()
  expect(screen.getByText('Fanpage chờ duyệt (1)')).toBeInTheDocument()
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Học kỳ thống kê hệ thống' }), {
    key: 'ArrowDown',
  })
  fireEvent.click(await screen.findByRole('option', { name: 'Học kỳ 1' }))
  await waitFor(() =>
    expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith('2026-2027', '9')
  )
})
it('shows an error and retry rather than replacing a failed dashboard with zero counts', async () => {
  vi.mocked(adminStatisticsService.getDashboard)
    .mockRejectedValueOnce(new Error('Forbidden'))
    .mockResolvedValueOnce(adminDashboard)
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thống kê hệ thống')
  expect(screen.queryByText('42')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByText('42')).toBeInTheDocument()
})

const options = () =>
  screen.getAllByTestId('chart').map((chart) => JSON.parse(chart.getAttribute('data-option')!))
it('ranks fanpages by the chosen metric and expands demographics beyond the first ten', async () => {
  const data = structuredClone(adminDashboard)
  data.topFanpages = Array.from({ length: 12 }, (_, i) => ({
    fanpageId: i + 1,
    fanpageName: `Fanpage ${i + 1}`,
    eventCount: 12 - i,
    attendeeCount: i * 10,
    followerCount: i,
  }))
  data.demographics.cohorts = Array.from({ length: 12 }, (_, i) => ({
    label: `Khóa ${i + 1}`,
    count: 12 - i,
    percentage: 5,
  }))
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(data)
  show()
  await screen.findByText('42')
  expect(options().find((item) => item.yAxis?.data?.[0] === 'Fanpage 1').yAxis.data).toHaveLength(
    10
  )
  fireEvent.click(screen.getByRole('button', { name: 'Lượt tham dự' }))
  expect(options().some((item) => item.yAxis?.data?.[0] === 'Fanpage 12')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả 12 nhóm' }))
  expect(options().find((item) => item.yAxis?.data?.[0] === 'Khóa 1').yAxis.data).toHaveLength(12)
  fireEvent.click(screen.getByRole('button', { name: 'Bảng' }))
  expect(screen.getByRole('link', { name: 'Fanpage 12' })).toHaveAttribute('href', '/fanpage/12')
})

it('keeps absence gaps as null and caps the percentage axis at 100', async () => {
  const data = structuredClone(adminDashboard)
  data.monthlyTrends = [
    {
      monthYear: '2026-01',
      eventCount: 1,
      registrationCount: 0,
      attendeeCount: 0,
      absentCount: 0,
      absentRate: 0,
    },
    {
      monthYear: '2026-03',
      eventCount: 1,
      registrationCount: 10,
      attendeeCount: 8,
      absentCount: 2,
      absentRate: 20,
    },
  ]
  data.monthlyAbsentRates = [
    { month: 1, monthName: 'Jan', totalRegistrations: 0, absentCount: 0, absentRate: 0 },
    { month: 3, monthName: 'Mar', totalRegistrations: 10, absentCount: 2, absentRate: 20 },
  ]
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(data)
  show()
  await screen.findByText('42')
  const line = options().find((item) => item.series?.[0]?.type === 'line')
  expect(line.yAxis.max).toBe(100)
  expect(line.series[0].connectNulls).toBe(false)
  expect(line.series[0].data).toEqual([null, null, 20])
  expect(line.xAxis.data).toEqual(['2026-01', '2026-02', '2026-03'])
})

it('switches explicitly to calendar-year scope and clears the semester selection', async () => {
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(adminDashboard)
  show()
  await screen.findByText('42')
  fireEvent.click(screen.getByRole('combobox', { name: 'Phạm vi thống kê' }))
  fireEvent.click(screen.getByRole('option', { name: 'Theo năm dương lịch' }))
  await waitFor(() =>
    expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith(
      new Date().getFullYear(),
      undefined
    )
  )
})

it('uses catalog year IDs to filter semesters, including years without semesters', async () => {
  vi.mocked(adminStatisticsService.getAcademicYears).mockResolvedValue([
    { id: 10, code: '2030-2031', isActive: true }, { id: 11, code: '2029-2030', isActive: true },
    { id: 12, code: '2028-2029', isActive: true },
  ])
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(adminDashboard)
  show([
    { id: 91, academicYearId: 10, academicYear: 'Nhãn không dùng để nối dữ liệu', number: 1, startDate: '', endDate: '', status: 'ONGOING', isCurrent: true, isActive: true },
    { id: 92, academicYearId: 11, academicYear: '2029-2030', number: 2, startDate: '', endDate: '', status: 'COMPLETED', isCurrent: false, isActive: true },
  ])
  await screen.findByText('42')
  expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith('2030-2031', undefined)
  fireEvent.click(screen.getByRole('combobox', { name: 'Học kỳ thống kê hệ thống' }))
  expect(screen.getAllByRole('option')).toHaveLength(2)
  fireEvent.click(screen.getByRole('option', { name: 'Học kỳ 1' }))
  await waitFor(() => expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith('2030-2031', '91'))
  fireEvent.click(screen.getByRole('combobox', { name: 'Năm thống kê hệ thống' }))
  fireEvent.click(screen.getByRole('option', { name: '2028-2029' }))
  await waitFor(() => expect(adminStatisticsService.getDashboard).toHaveBeenLastCalledWith('2028-2029', undefined))
  fireEvent.click(screen.getByRole('combobox', { name: 'Học kỳ thống kê hệ thống' }))
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(screen.getByRole('option', { name: 'Tất cả học kỳ' })).toBeInTheDocument()
})

it('does not fabricate a year or request statistics when the catalog is empty', async () => {
  vi.mocked(adminStatisticsService.getAcademicYears).mockResolvedValue([])
  show()
  expect(await screen.findByText('Chưa có năm học để thống kê.')).toBeInTheDocument()
  expect(adminStatisticsService.getDashboard).not.toHaveBeenCalled()
})

it('retries the year catalog after a loading error before requesting statistics', async () => {
  vi.mocked(adminStatisticsService.getAcademicYears).mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([{ id: 1, code: '2026-2027', isActive: true }])
  vi.mocked(adminStatisticsService.getDashboard).mockResolvedValue(adminDashboard)
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh sách năm học')
  expect(adminStatisticsService.getDashboard).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại năm học' }))
  expect(await screen.findByText('42')).toBeInTheDocument()
})
