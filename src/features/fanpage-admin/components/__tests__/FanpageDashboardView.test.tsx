import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageDashboardView } from '../FanpageDashboardView'
import {
  fanpageStatisticsService,
  type FanpageDashboardData,
} from '../../services/fanpageStatisticsService'
import type { FanpageSummary } from '../../types/fanpageAdmin.types'

vi.mock('../../services/fanpageStatisticsService', () => ({
  fanpageStatisticsService: { getDashboard: vi.fn() },
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
  HTMLElement.prototype.scrollIntoView = vi.fn()
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
    expect(fetchDashboard).toHaveBeenCalledWith('7', year)
  })
  it('shows loading and retry instead of numbers when the backend fails', async () => {
    fetchDashboard.mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValueOnce(empty)
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
        { month: `${year}-03`, eventsCount: 1, registrationsCount: 12, attendeesCount: 0 },
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
    expect(option.series[0].data).toEqual([0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(option.series[1].data).toEqual(Array(12).fill(0))
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })
  it('refetches the selected year for trends and demographics', async () => {
    fetchDashboard.mockResolvedValue(empty)
    show()
    const select = await screen.findByRole('combobox', { name: 'Năm phân tích' })
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: `Năm ${year - 1}` }))
    await waitFor(() => expect(fetchDashboard).toHaveBeenLastCalledWith('7', year - 1))
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
  expect(option.series[0].data[10]).toBe(59)
  expect(option.series[1].data[10]).toBe(38)
})
