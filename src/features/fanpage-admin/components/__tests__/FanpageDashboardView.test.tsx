vi.mock('@/features/training-points', () => ({
  trainingPointsService: {
    getAcademicYears: vi.fn(),
    getSemesters: vi.fn().mockResolvedValue([{ id: 9, number: 1, academicYear: '2026-2027' }]),
  },
}))
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageDashboardView } from '../FanpageDashboardView'
import { trainingPointsService } from '@/features/training-points'
import {
  fanpageStatisticsService,
  type FanpageDashboardData,
} from '../../services/fanpageStatisticsService'
import type { FanpageSummary } from '../../types/fanpageAdmin.types'

vi.mock('../../services/fanpageStatisticsService', () => ({
  fanpageStatisticsService: {
    getDashboard: vi.fn(),
    getDemographics: vi.fn().mockResolvedValue({ cohorts: [], schools: [], majors: [] }),
    getAbsentRates: vi.fn().mockResolvedValue([]),
    getAbsentStudents: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('@/components/ui/EChartsReact', () => ({
  EChartsReact: ({ option }: { option: unknown }) => (
    <div data-testid="chart" data-option={JSON.stringify(option)} />
  ),
}))
const fetchDashboard = vi.mocked(fanpageStatisticsService.getDashboard)
const year = new Date().getFullYear()
const empty: FanpageDashboardData = {
  overview: { totalEvents: 0, totalRegistrations: 0, totalAttendees: 0, totalFollowers: 0 },
  monthlyTrends: [],
  eventDistribution: [],
  topEvents: [],
  demographics: { cohorts: [], schools: [], majors: [] },
}
function show() {
  const onEventClick = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <FanpageDashboardView
        currentFanpage={{ id: '7', name: 'Fanpage kiểm thử' } as FanpageSummary}
        onEventClick={onEventClick}
      />
    </QueryClientProvider>
  )
  return { onEventClick }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(trainingPointsService.getAcademicYears).mockResolvedValue([
    { id: 2, code: `${year} - ${year + 1}`, isActive: true },
    { id: 1, code: `${year - 1} - ${year}` },
  ])
  vi.mocked(trainingPointsService.getSemesters).mockResolvedValue([
    {
      id: 8,
      number: 1,
      academicYearId: 1,
      startDate: `${year - 1}-09-01`,
      endDate: `${year}-01-15`,
    },
    {
      id: 9,
      number: 1,
      academicYearId: 2,
      startDate: `${year}-09-01`,
      endDate: `${year + 1}-01-15`,
    },
  ])
  HTMLElement.prototype.scrollIntoView = vi.fn()
})

it('orders year before semester, hides internal IDs and limits months to the selected semester', async () => {
  fetchDashboard.mockResolvedValue({
    ...empty,
    monthlyTrends: [
      { month: `${year}-03`, eventsCount: 5, registrationsCount: 5, attendeesCount: 3 },
      { month: `${year}-11`, eventsCount: 2, registrationsCount: 4, attendeesCount: 3 },
    ],
  })
  show()
  const semester = await screen.findByRole('combobox', { name: 'Học kỳ phân tích' })
  const yearSelect = screen.getByRole('combobox', { name: 'Năm học phân tích' })
  expect(
    yearSelect.compareDocumentPosition(semester) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  fireEvent.keyDown(semester, { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: 'Học kỳ 1' }))
  await waitFor(() => expect(fetchDashboard).toHaveBeenCalledWith('7', year + 1, '9'))
  await waitFor(() => {
    const option = JSON.parse(screen.getByTestId('chart').getAttribute('data-option')!)
    expect(option.xAxis.data).toEqual([
      `Th.9/${year}`,
      `Th.10/${year}`,
      `Th.11/${year}`,
      `Th.12/${year}`,
      `Th.1/${year + 1}`,
    ])
  })
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Năm học phân tích' }), {
    key: 'ArrowDown',
  })
  fireEvent.click(await screen.findByRole('option', { name: `${year - 1} - ${year}` }))
  await waitFor(() => expect(fetchDashboard).toHaveBeenCalledWith('7', year - 1, '8'))
})

describe('fanpage dashboard data states', () => {
  it('keeps an empty fanpage empty without invented curves or demographics', async () => {
    fetchDashboard.mockResolvedValue(empty)
    show()
    expect(await screen.findByText('Tổng sự kiện')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có dữ liệu.')).toHaveLength(4)
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
    expect(screen.queryByText(/so với học kỳ trước/)).not.toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(fetchDashboard).toHaveBeenCalledWith('7', year, '9')
  })
  it('shows loading and retry instead of numbers when the backend fails', async () => {
    fetchDashboard.mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValue(empty)
    show()
    expect(screen.getByRole('status', { name: 'Đang tải thống kê' })).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thống kê fanpage.')
    expect(screen.getByRole('button', { name: 'Tải CSV' })).toBeDisabled()
    expect(screen.queryByText('Tổng sự kiện')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Tổng sự kiện')).toBeInTheDocument()
  })
  it('uses genuine counts, zero attendance and keyboard accessible event actions', async () => {
    fetchDashboard.mockResolvedValue({
      ...empty,
      overview: { totalEvents: 1, totalRegistrations: 12, totalAttendees: 0, totalFollowers: 4 },
      monthlyTrends: [
        { month: `${year}-11`, eventsCount: 1, registrationsCount: 12, attendeesCount: 0 },
      ],
      topEvents: [
        {
          eventId: 81,
          eventName: 'Sự kiện thử',
          totalRegistrations: 12,
          totalAttendees: 0,
          attendanceRate: 0,
        },
      ],
    })
    const { onEventClick } = show()
    fireEvent.click(await screen.findByRole('button', { name: 'Sự kiện thử' }))
    expect(onEventClick).toHaveBeenCalledWith('81')
    const chart = screen.getByTestId('chart')
    const option = JSON.parse(chart.getAttribute('data-option')!)
    expect(option.series[0].data).toEqual([0, 0, 12, 0, 0])
    expect(option.series[1].data).toEqual(Array(5).fill(0))
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })
  it('refetches the selected year for trends and demographics', async () => {
    fetchDashboard.mockResolvedValue(empty)
    show()
    const select = await screen.findByRole('combobox', { name: 'Năm học phân tích' })
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: `${year - 1} - ${year}` }))
    await waitFor(() => expect(fetchDashboard).toHaveBeenCalledWith('7', year - 1, '8'))
  })
})

it('shows registration and attendance side by side with both real monthly totals', async () => {
  fetchDashboard.mockResolvedValue({
    ...empty,
    overview: { totalEvents: 15, totalRegistrations: 59, totalAttendees: 38, totalFollowers: 0 },
    monthlyTrends: [
      { month: `${year}-11`, eventsCount: 15, registrationsCount: 59, attendeesCount: 38 },
    ],
  })
  show()
  const chart = await screen.findByTestId('chart')
  const option = JSON.parse(chart.getAttribute('data-option')!)
  expect(option.series.map((series: { type: string }) => series.type)).toEqual(['bar', 'bar'])
  expect(option.series[0].data[2]).toBe(59)
  expect(option.series[1].data[2]).toBe(38)
  expect(option.legend.selectedMode).toBe(false)
  for (const series of option.series) {
    expect(series.legendHoverLink).toBe(false)
    expect(series.emphasis.focus).toBe('none')
    expect(series.emphasis.itemStyle.opacity).toBe(1)
    expect(series.blur.itemStyle.opacity).toBe(1)
  }
})

it('shows event type proportions using actual API counts and an accessible legend', async () => {
  fetchDashboard.mockResolvedValue({
    ...empty,
    overview: { ...empty.overview, totalEvents: 6 },
    eventDistribution: [
      { eventTypeName: 'Học thuật', eventCount: 4, percentage: 66.7 },
      { eventTypeName: 'Tình nguyện', eventCount: 2, percentage: 33.3 },
    ],
  })
  show()
  const chart = await screen.findByTestId('chart')
  const option = JSON.parse(chart.getAttribute('data-option')!)
  expect(option.series[0].type).toBe('pie')
  expect(option.series[0].radius).toEqual(['48%', '72%'])
  expect(option.series[0].data).toEqual([
    { name: 'Học thuật', value: 4 },
    { name: 'Tình nguyện', value: 2 },
  ])
  expect(screen.getByText('Học thuật')).toBeInTheDocument()
  expect(screen.getByText('Tình nguyện')).toBeInTheDocument()
  expect(screen.getByText('4 · 66,7%')).toBeInTheDocument()
  expect(screen.getByText('2 · 33,3%')).toBeInTheDocument()
})

it('does not draw a fabricated donut when every event type has a zero count', async () => {
  fetchDashboard.mockResolvedValue({
    ...empty,
    eventDistribution: [{ eventTypeName: 'Học thuật', eventCount: 0, percentage: 0 }],
  })
  show()
  expect(await screen.findByText('Tổng sự kiện')).toBeInTheDocument()
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
})

it('shows the whole academic year for all semesters and restores a specific semester filter', async () => {
  vi.mocked(trainingPointsService.getAcademicYears).mockResolvedValue([
    {
      id: 2,
      code: `${year}-${year + 1}`,
      isActive: true,
      startDate: `${year}-09-01`,
      endDate: `${year + 1}-08-31`,
    },
  ])
  vi.mocked(trainingPointsService.getSemesters).mockResolvedValue([
    {
      id: 9,
      number: 1,
      academicYearId: 2,
      startDate: `${year}-09-01`,
      endDate: `${year + 1}-01-31`,
    },
    {
      id: 10,
      number: 2,
      academicYearId: 2,
      startDate: `${year + 1}-02-01`,
      endDate: `${year + 1}-08-31`,
    },
  ])
  fetchDashboard.mockImplementation(async (_id, calendarYear, semesterId) => ({
    ...empty,
    monthlyTrends:
      calendarYear === year && semesterId === '9'
        ? [{ month: `${year}-11`, eventsCount: 2, registrationsCount: 4, attendeesCount: 3 }]
        : calendarYear === year + 1 && semesterId === '10'
          ? [{ month: `${year + 1}-02`, eventsCount: 3, registrationsCount: 6, attendeesCount: 5 }]
          : [],
  }))
  show()
  await screen.findByTestId('chart')
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Học kỳ phân tích' }), {
    key: 'ArrowDown',
  })
  fireEvent.click(await screen.findByRole('option', { name: 'Tất cả học kỳ' }))
  await waitFor(() => {
    const option = JSON.parse(screen.getByTestId('chart').getAttribute('data-option')!)
    expect(option.xAxis.data).toHaveLength(12)
    expect(option.xAxis.data[0]).toBe(`Th.9/${year}`)
    expect(option.xAxis.data[11]).toBe(`Th.8/${year + 1}`)
    expect(option.series[0].data[2]).toBe(4)
    expect(option.series[0].data[5]).toBe(6)
  })
  expect(screen.getByText('Chọn học kỳ để xem sinh viên vắng nhiều lần.')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Học kỳ phân tích' }), {
    key: 'ArrowDown',
  })
  fireEvent.click(await screen.findByRole('option', { name: 'Học kỳ 2' }))
  await waitFor(() => {
    const option = JSON.parse(screen.getByTestId('chart').getAttribute('data-option')!)
    expect(option.xAxis.data).toHaveLength(7)
    expect(option.xAxis.data[0]).toBe(`Th.2/${year + 1}`)
  })
})
