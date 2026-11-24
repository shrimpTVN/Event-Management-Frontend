import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageAbsencePanel } from '../FanpageAbsencePanel'
import { fanpageStatisticsService } from '../../services/fanpageStatisticsService'
import { EChartsReact } from '@/components/ui/EChartsReact'
vi.mock('../../services/fanpageStatisticsService', () => ({
  fanpageStatisticsService: {
    getAbsentRates: vi.fn(),
    getAbsentStudents: vi.fn(),
    alertAbsentStudents: vi.fn(),
  },
}))
vi.mock('@/components/ui/EChartsReact', () => ({
  EChartsReact: vi.fn(({ option }: { option: unknown }) => (
    <div data-testid="absence-chart" data-option={JSON.stringify(option)} />
  )),
}))
const rows = [
  {
    userId: 81,
    studentId: 'B2300001',
    fullName: 'Sinh viên A',
    email: 'a@student.ctu.edu.vn',
    absenceCount: 3,
  },
]
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fanpageStatisticsService.alertAbsentStudents).mockReset()
  vi.mocked(fanpageStatisticsService.getAbsentRates).mockReset()
  vi.mocked(fanpageStatisticsService.getAbsentStudents).mockReset()
  vi.mocked(fanpageStatisticsService.getAbsentRates).mockResolvedValue([])
  vi.mocked(fanpageStatisticsService.getAbsentStudents).mockResolvedValue(rows)
  HTMLElement.prototype.scrollIntoView = vi.fn()
})

it('allows thresholds above five, clears selection and never requests an invalid threshold', async () => {
  show('9')
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Chọn Sinh viên A' }))
  expect(screen.getByRole('button', { name: 'Nhắc nhở sinh viên đã chọn' })).toBeEnabled()
  const input = screen.getByRole('spinbutton', { name: 'Số lần vắng tối thiểu' })
  const calls = vi.mocked(fanpageStatisticsService.getAbsentStudents).mock.calls.length
  for (const value of ['', '0', '-1', '1.5']) {
    fireEvent.change(input, { target: { value } })
    expect(screen.getByText('Nhập số nguyên dương hợp lệ.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  }
  expect(fanpageStatisticsService.getAbsentStudents).toHaveBeenCalledTimes(calls)
  fireEvent.change(input, { target: { value: '6' } })
  await waitFor(() =>
    expect(fanpageStatisticsService.getAbsentStudents).toHaveBeenLastCalledWith('7', '9', 6)
  )
  expect(await screen.findByText('1 sinh viên phù hợp · Đã chọn 0')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Nhắc nhở sinh viên đã chọn' })).toBeDisabled()
  expect(fanpageStatisticsService.alertAbsentStudents).not.toHaveBeenCalled()
})

it('shows count and rate in tooltips, distinguishing no registrations from zero absences', async () => {
  vi.mocked(fanpageStatisticsService.getAbsentRates).mockResolvedValue([
    { month: 9, monthName: 'Tháng 9', totalRegistrations: 20, absentCount: 4, absentRate: 20 },
    { month: 10, monthName: 'Tháng 10', totalRegistrations: 0, absentCount: 0, absentRate: 0 },
    { month: 11, monthName: 'Tháng 11', totalRegistrations: 8, absentCount: 0, absentRate: 0 },
  ])
  show('9')
  await screen.findByTestId('absence-chart')
  const option = vi.mocked(EChartsReact).mock.calls.at(-1)![0].option as {
    tooltip: { formatter: (params: unknown) => string }
    xAxis: { axisLabel: { formatter: (value: string, index: number) => string } }
    series: { data: (number | null)[] }[]
  }
  expect(option.series[0].data).toEqual([20, null, 0])
  expect(option.tooltip.formatter([{ dataIndex: 0 }])).toContain('Vắng 4 / 20 lượt đăng ký · 20%')
  expect(option.tooltip.formatter([{ dataIndex: 1 }])).toContain('Chưa có dữ liệu')
  expect(option.tooltip.formatter([{ dataIndex: 2 }])).toContain('Vắng 0 / 8 lượt đăng ký · 0%')
  expect(option.xAxis.axisLabel.formatter('Tháng 10', 1)).toContain('Chưa có dữ liệu')
})
function show(semesterId?: string) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <FanpageAbsencePanel
        fanpageId="7"
        fanpageName="Đoàn CTU"
        year={2026}
        semesterId={semesterId}
      />
    </QueryClientProvider>
  )
}
it('does not fetch a student absence list without a semester', async () => {
  show()
  expect(screen.getByText('Chọn học kỳ để xem sinh viên vắng nhiều lần.')).toBeInTheDocument()
  await waitFor(() =>
    expect(fanpageStatisticsService.getAbsentRates).toHaveBeenCalledWith('7', 2026, undefined)
  )
  expect(fanpageStatisticsService.getAbsentStudents).not.toHaveBeenCalled()
  expect(fanpageStatisticsService.alertAbsentStudents).not.toHaveBeenCalled()
})
it('previews selected recipients and sends only on confirmation, retaining errors for retry', async () => {
  vi.mocked(fanpageStatisticsService.alertAbsentStudents)
    .mockRejectedValueOnce(new Error('Failed'))
    .mockResolvedValueOnce(undefined)
  show('9')
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Chọn Sinh viên A' }))
  expect(screen.queryByLabelText('Nội dung nhắc nhở')).not.toBeInTheDocument()
  expect(screen.getByText('1 sinh viên phù hợp · Đã chọn 1')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Nhắc nhở sinh viên đã chọn' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nội dung nhắc nhở'), {
    target: { value: 'Vui lòng tham gia đúng lịch.' },
  })
  expect(within(dialog).getByText(/Sinh viên A/)).toBeInTheDocument()
  expect(fanpageStatisticsService.alertAbsentStudents).not.toHaveBeenCalled()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi thông báo' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Chưa gửi được')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi thông báo' }))
  expect(await screen.findByText('Đã gửi thông báo đến 1 sinh viên.')).toBeInTheDocument()
  expect(fanpageStatisticsService.alertAbsentStudents).toHaveBeenLastCalledWith(
    '7',
    '9',
    [81],
    'Vui lòng tham gia đúng lịch.'
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('loads and orders absence months across both calendar years of the semester', async () => {
  vi.mocked(fanpageStatisticsService.getAbsentRates).mockImplementation(async (_id, year) => [
    { month: 1, monthName: 'Tháng 1', totalRegistrations: 10, absentCount: 1, absentRate: 10 },
    {
      month: 12,
      monthName: 'Tháng 12',
      totalRegistrations: 10,
      absentCount: 2,
      absentRate: year === 2026 ? 20 : 30,
    },
  ])
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <FanpageAbsencePanel
        fanpageId="7"
        fanpageName="Đoàn CTU"
        year={2026}
        semesterId="9"
        periodMonths={['2026-12', '2027-01']}
        periodLabel="Năm học 2026 - 2027 · Học kỳ 1"
      />
    </QueryClientProvider>
  )
  const chart = await screen.findByTestId('absence-chart')
  const option = JSON.parse(chart.getAttribute('data-option')!)
  expect(option.xAxis.data).toEqual(['Th.12/2026', 'Th.1/2027'])
  expect(option.series[0].data).toEqual([20, 10])
  expect(fanpageStatisticsService.getAbsentRates).toHaveBeenCalledWith('7', 2027, '9')
})
