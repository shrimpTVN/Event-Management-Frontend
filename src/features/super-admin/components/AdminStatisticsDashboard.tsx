import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, UserCheck, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EChartsReact } from '@/components/ui/EChartsReact'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminStatisticsService } from '../services/adminStatisticsService'
import type {
  SuperAdminFanpage,
  SuperAdminSemester,
  SuperAdminNavTab,
} from '../types/superAdmin.types'
import type { EChartsOption } from 'echarts'
import { statisticsMonths } from '../utils/statisticsMonths'

function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-k2d text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}
const empty = (
  <p className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
    Chưa có dữ liệu trong phạm vi đã chọn.
  </p>
)
const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
const palette = ['#1B4B8A', '#38BDF8', '#14B8A6', '#A78BFA', '#F59E0B', '#F472B6', '#64748B']
const chartBase: EChartsOption = {
  animationDuration: 550,
  textStyle: { fontFamily: 'Readex Pro, sans-serif', color: '#64748B' },
  aria: { enabled: true },
}
function horizontal(labels: string[], values: number[]): EChartsOption {
  return {
    ...chartBase,
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
    grid: { left: 12, right: 48, top: 12, bottom: 24, containLabel: true },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#94a3b826' } } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { width: 140, overflow: 'truncate', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        name: 'Số lượng',
        data: values,
        barMaxWidth: 20,
        itemStyle: { color: palette[0], borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#64748B' },
      },
    ],
  }
}

export function AdminStatisticsDashboard({
  semesters,
  pendingFanpages,
  onNavigateTab,
  onReviewFanpage,
}: {
  semesters: SuperAdminSemester[]
  pendingFanpages: SuperAdminFanpage[]
  onNavigateTab: (tab: SuperAdminNavTab) => void
  onReviewFanpage: (fanpage: SuperAdminFanpage) => void
}) {
  const current = new Date()
  const currentYear = current.getFullYear()
  const [mode, setMode] = useState('academic')
  const [academicYearId, setAcademicYearId] = useState('')
  const academicYearsQuery = useQuery({
    queryKey: ['academic-years', 'admin-statistics'],
    queryFn: () => adminStatisticsService.getAcademicYears(),
    staleTime: 60_000,
    retry: false,
  })
  const years = academicYearsQuery.data ?? []
  const currentSemester = semesters.find((item) => item.isCurrent)
  const selectedYear =
    years.find((item) => String(item.id) === academicYearId) ??
    years.find((item) => item.id === currentSemester?.academicYearId) ??
    years.find(
      (item) =>
        item.startDate &&
        item.endDate &&
        Date.parse(item.startDate) <= Date.now() &&
        Date.parse(item.endDate) + 86_400_000 > Date.now()
    ) ??
    years.find((item) => item.isActive) ??
    years[0]
  const [calendarYear, setCalendarYear] = useState(String(currentYear))
  const [semesterId, setSemesterId] = useState('ALL')
  const [group, setGroup] = useState<'cohorts' | 'schools' | 'majors'>('cohorts')
  const [fanpageMetric, setFanpageMetric] = useState<'eventCount' | 'attendeeCount'>('eventCount')
  const [fanpageView, setFanpageView] = useState('chart')
  const [showAllFanpages, setShowAllFanpages] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const availableSemesters = semesters
    .filter((item) =>
      mode === 'academic'
        ? Boolean(selectedYear && item.academicYearId === selectedYear.id)
        : Boolean(
            item.startDate &&
            item.endDate &&
            Date.parse(item.startDate) <= Date.parse(`${calendarYear}-12-31`) &&
            Date.parse(item.endDate) >= Date.parse(`${calendarYear}-01-01`)
          )
    )
    .sort((a, b) => a.number - b.number || a.startDate.localeCompare(b.startDate))
  const selectedSemester = availableSemesters.some((item) => String(item.id) === semesterId)
    ? semesterId
    : 'ALL'
  const period = mode === 'academic' ? (selectedYear?.code ?? '') : Number(calendarYear)
  const ready = mode === 'calendar' || Boolean(selectedYear)
  const scope = ready
    ? `${mode === 'academic' ? 'Năm học' : 'Năm'} ${period}${selectedSemester === 'ALL' ? ' · Tất cả học kỳ' : ` · Học kỳ ${availableSemesters.find((item) => String(item.id) === selectedSemester)?.number}`}`
    : 'Thống kê hoạt động hệ thống'
  const query = useQuery({
    queryKey: ['admin-statistics-dashboard', period, selectedSemester],
    queryFn: () =>
      adminStatisticsService.getDashboard(
        period,
        selectedSemester === 'ALL' ? undefined : selectedSemester
      ),
    retry: false,
    staleTime: 60_000,
    enabled: ready,
  })
  const data = query.data
  const trend = [...(data?.monthlyTrends || [])].sort((a, b) =>
    a.monthYear.localeCompare(b.monthYear)
  )
  const demographics = [...(data?.demographics[group] || [])].sort((a, b) => b.count - a.count)
  const groups = showAllGroups ? demographics : demographics.slice(0, 10)
  const fanpages = [...(data?.topFanpages || [])].sort(
    (a, b) => b[fanpageMetric] - a[fanpageMetric]
  )
  const displayedFanpages = showAllFanpages ? fanpages : fanpages.slice(0, 10)
  const groupLabel = group === 'cohorts' ? 'Khóa' : group === 'schools' ? 'Khoa / Trường' : 'Ngành'
  const absence = statisticsMonths(trend.map((item) => item.monthYear)).map((month) => {
    const point = trend.find((item) => item.monthYear === month)
    return {
      label: month,
      value: point
        ? {
            totalRegistrations: point.registrationCount,
            absentCount: point.absentCount,
            absentRate: point.absentRate,
          }
        : undefined,
    }
  })
  const changePeriod = (value: string) => {
    if (mode === 'academic') setAcademicYearId(value)
    else setCalendarYear(value)
    setSemesterId('ALL')
  }

  return (
    <div className="flex flex-col gap-5 text-left sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-k2d text-2xl font-bold">Tổng quan hệ thống</h1>
          <p className="text-sm text-muted-foreground">{scope}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Select
            value={mode}
            onValueChange={(value) => {
              setMode(value)
              setSemesterId('ALL')
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Phạm vi thống kê">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Theo năm học</SelectItem>
              <SelectItem value="calendar">Theo năm dương lịch</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={
              mode === 'academic' ? (selectedYear ? String(selectedYear.id) : '') : calendarYear
            }
            disabled={
              mode === 'academic' &&
              (academicYearsQuery.isPending || academicYearsQuery.isError || !years.length)
            }
            onValueChange={changePeriod}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Năm thống kê hệ thống">
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {mode === 'academic'
                ? years.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.code}
                    </SelectItem>
                  ))
                : Array.from({ length: 10 }, (_, i) => String(currentYear - i)).map((value) => (
                    <SelectItem key={value} value={value}>
                      Năm {value}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={setSemesterId} disabled={!ready}>
            <SelectTrigger
              className="col-span-2 h-10 w-full sm:w-44"
              aria-label="Học kỳ thống kê hệ thống"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
              {availableSemesters.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  Học kỳ {item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      {mode === 'academic' && academicYearsQuery.isError ? (
        <div role="alert" className="flex items-center gap-3">
          <p>Không tải được danh sách năm học.</p>
          <Button variant="outline" onClick={() => void academicYearsQuery.refetch()}>
            Tải lại năm học
          </Button>
        </div>
      ) : mode === 'academic' && !academicYearsQuery.isPending && !selectedYear ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Chưa có năm học để thống kê.
        </p>
      ) : (mode === 'academic' && academicYearsQuery.isPending) || (ready && query.isPending) ? (
        <div role="status" aria-label="Đang tải thống kê hệ thống" className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : query.isError || !data ? (
        <div role="alert" className="flex items-center gap-3">
          <p>Không tải được thống kê hệ thống.</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
            {[
              {
                label: 'Sự kiện',
                value: number(data.overview.events.totalEvents),
                detail: `${number(data.overview.events.cancelledEvents)} sự kiện đã hủy`,
                icon: CalendarDays,
              },
              {
                label: 'Lượt đăng ký',
                value: number(data.overview.attendance.totalRegistrations),
                detail: 'Theo phạm vi đã chọn',
                icon: ClipboardList,
              },
              {
                label: 'Lượt tham dự',
                value: number(data.overview.attendance.totalAttendees),
                detail: 'Theo phạm vi đã chọn',
                icon: UserCheck,
              },
              {
                label: 'Tỷ lệ tham dự',
                value: data.overview.attendance.totalRegistrations
                  ? `${number(data.overview.attendance.attendanceRate)}%`
                  : '—',
                detail: `${number(data.overview.attendance.absentCount)} lượt vắng`,
                icon: Percent,
              },
            ].map(({ label, value, detail, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <p className="font-k2d text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
          <Panel title="Đăng ký và điểm danh theo tháng" subtitle={scope}>
            {trend.some((item) => item.registrationCount || item.attendeeCount) ? (
              <EChartsReact
                animateOnView
                option={{
                  ...chartBase,
                  color: [palette[0], palette[1]],
                  tooltip: {
                    trigger: 'axis',
                    renderMode: 'richText',
                    confine: true,
                    formatter: (params: any) => {
                      const item = trend[params[0]?.dataIndex]
                      return item
                        ? `${item.monthYear}\nĐăng ký: ${number(item.registrationCount)}\nĐiểm danh: ${number(item.attendeeCount)}\nTỷ lệ tham dự: ${item.registrationCount ? number((item.attendeeCount / item.registrationCount) * 100) + '%' : 'Chưa có dữ liệu'}`
                        : ''
                    },
                  },
                  legend: { bottom: 0, textStyle: { color: '#64748B' } },
                  grid: { left: 20, right: 20, top: 20, bottom: 48, containLabel: true },
                  xAxis: { type: 'category', data: trend.map((item) => item.monthYear) },
                  yAxis: { type: 'value', minInterval: 1 },
                  series: [
                    {
                      name: 'Đăng ký',
                      type: 'bar',
                      barMaxWidth: 28,
                      data: trend.map((item) => item.registrationCount),
                      itemStyle: { borderRadius: [4, 4, 0, 0] },
                    },
                    {
                      name: 'Điểm danh',
                      type: 'bar',
                      barMaxWidth: 28,
                      data: trend.map((item) => item.attendeeCount),
                      itemStyle: { borderRadius: [4, 4, 0, 0] },
                    },
                  ],
                }}
              />
            ) : (
              empty
            )}
          </Panel>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2 sm:gap-6">
            <Panel
              title="Top fanpage hoạt động"
              subtitle={
                fanpageMetric === 'eventCount' ? 'Xếp theo số sự kiện' : 'Xếp theo lượt tham dự'
              }
              actions={
                <div className="flex gap-1" role="group" aria-label="Hiển thị fanpage">
                  {['chart', 'table'].map((value) => (
                    <Button
                      key={value}
                      variant={fanpageView === value ? 'secondary' : 'ghost'}
                      size="sm"
                      aria-pressed={fanpageView === value}
                      onClick={() => setFanpageView(value)}
                    >
                      {value === 'chart' ? 'Biểu đồ' : 'Bảng'}
                    </Button>
                  ))}
                </div>
              }
            >
              <div className="flex gap-2" role="group" aria-label="Xếp hạng fanpage">
                {(
                  [
                    ['eventCount', 'Số sự kiện'],
                    ['attendeeCount', 'Lượt tham dự'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={fanpageMetric === value ? 'secondary' : 'ghost'}
                    aria-pressed={fanpageMetric === value}
                    onClick={() => setFanpageMetric(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {fanpages.length ? (
                <>
                  {fanpageView === 'chart' ? (
                    <div className="max-h-[420px] overflow-y-auto">
                      <EChartsReact
                        animateOnView
                        style={{
                          height: Math.max(200, displayedFanpages.length * 38 + 45),
                          width: '100%',
                        }}
                        option={horizontal(
                          displayedFanpages.map((item) => item.fanpageName),
                          displayedFanpages.map((item) => item[fanpageMetric])
                        )}
                      />
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Fanpage</th>
                            <th className="p-2 text-right font-medium">Sự kiện</th>
                            <th className="p-2 text-right font-medium">Theo dõi</th>
                            <th className="p-2 text-right font-medium">Tham dự</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedFanpages.map((item) => (
                            <tr key={item.fanpageId} className="border-b border-border/50">
                              <td className="py-3 pr-3">
                                <Link
                                  to={`/fanpage/${item.fanpageId}`}
                                  className="text-primary hover:underline"
                                >
                                  {item.fanpageName}
                                </Link>
                              </td>
                              <td className="p-2 text-right tabular-nums">
                                {number(item.eventCount)}
                              </td>
                              <td className="p-2 text-right tabular-nums">
                                {number(item.followerCount)}
                              </td>
                              <td className="p-2 text-right tabular-nums">
                                {number(item.attendeeCount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {fanpages.length > 10 && (
                    <Button
                      variant="ghost"
                      className="self-start text-primary"
                      onClick={() => setShowAllFanpages(!showAllFanpages)}
                    >
                      {showAllFanpages
                        ? 'Thu gọn fanpage'
                        : `Xem tất cả ${fanpages.length} fanpage`}
                    </Button>
                  )}
                </>
              ) : (
                empty
              )}
            </Panel>
            <Panel title="Cơ cấu loại sự kiện" subtitle="Số lượng và tỷ trọng từng loại">
              {data.eventDistribution.some((item) => item.eventCount > 0) ? (
                <>
                  <EChartsReact
                    animateOnView
                    option={{
                      ...chartBase,
                      color: palette,
                      tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
                      title: {
                        text: number(
                          data.eventDistribution.reduce((sum, item) => sum + item.eventCount, 0)
                        ),
                        subtext: 'sự kiện',
                        left: 'center',
                        top: '39%',
                        textStyle: { color: '#64748B', fontSize: 28 },
                        subtextStyle: { fontSize: 12 },
                      },
                      series: [
                        {
                          type: 'pie',
                          radius: ['52%', '75%'],
                          label: { show: false },
                          data: data.eventDistribution.map((item) => ({
                            name: item.eventTypeName,
                            value: item.eventCount,
                          })),
                        },
                      ],
                    }}
                  />
                  <ul className="flex flex-col gap-2">
                    {data.eventDistribution.map((item, index) => (
                      <li
                        key={item.eventTypeId ?? item.eventTypeName}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: palette[index % palette.length] }}
                          />
                          {item.eventTypeName}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {number(item.eventCount)} · {number(item.percentage)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                empty
              )}
            </Panel>
            <Panel
              title="Sinh viên đăng ký theo đơn vị"
              subtitle={`Phân bố lượt đăng ký · ${groupLabel}`}
            >
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['cohorts', 'Khóa'],
                    ['schools', 'Khoa / Trường'],
                    ['majors', 'Ngành'],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={group === key ? 'secondary' : 'ghost'}
                    aria-pressed={group === key}
                    onClick={() => {
                      setGroup(key)
                      setShowAllGroups(false)
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {demographics.length ? (
                <>
                  <div className="max-h-[420px] overflow-y-auto">
                    <EChartsReact
                      animateOnView
                      style={{ height: Math.max(220, groups.length * 38 + 45), width: '100%' }}
                      option={horizontal(
                        groups.map((item) =>
                          item.label === 'UNKNOWN' ? 'Chưa xác định' : item.label
                        ),
                        groups.map((item) => item.count)
                      )}
                    />
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary">Xem số liệu chi tiết</summary>
                    <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-auto">
                      {groups.map((item) => (
                        <li
                          key={item.label}
                          className="flex justify-between gap-3 border-b border-border/50 py-2"
                        >
                          <span>{item.label === 'UNKNOWN' ? 'Chưa xác định' : item.label}</span>
                          <span className="shrink-0 tabular-nums">
                            {number(item.count)} · {number(item.percentage)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                  {demographics.length > 10 && (
                    <Button
                      variant="ghost"
                      className="self-start text-primary"
                      onClick={() => setShowAllGroups(!showAllGroups)}
                    >
                      {showAllGroups ? 'Thu gọn đơn vị' : `Xem tất cả ${demographics.length} nhóm`}
                    </Button>
                  )}
                </>
              ) : (
                empty
              )}
            </Panel>
            <Panel
              title="Tỷ lệ vắng theo tháng"
              subtitle="Tháng không có lượt đăng ký được để trống"
            >
              {absence.some((item) => item.value && item.value.totalRegistrations > 0) ? (
                <EChartsReact
                  animateOnView
                  option={{
                    ...chartBase,
                    color: ['#D97706'],
                    tooltip: {
                      trigger: 'axis',
                      renderMode: 'richText',
                      confine: true,
                      formatter: (params: any) => {
                        const point = absence[params[0]?.dataIndex]
                        return point
                          ? `${point.label}\n${point.value?.totalRegistrations ? `Vắng: ${number(point.value.absentRate)}%\n${number(point.value.absentCount)} / ${number(point.value.totalRegistrations)} lượt đăng ký` : 'Chưa có dữ liệu'}`
                          : ''
                      },
                    },
                    grid: { left: 16, right: 16, top: 20, bottom: 20, containLabel: true },
                    xAxis: { type: 'category', data: absence.map((item) => item.label) },
                    yAxis: {
                      type: 'value',
                      min: 0,
                      max: 100,
                      axisLabel: { formatter: '{value}%' },
                    },
                    series: [
                      {
                        name: 'Tỷ lệ vắng',
                        type: 'line',
                        connectNulls: false,
                        symbolSize: 7,
                        data: absence.map((item) =>
                          item.value?.totalRegistrations ? item.value.absentRate : null
                        ),
                        lineStyle: { width: 3 },
                        areaStyle: { opacity: 0.07 },
                      },
                    ],
                  }}
                />
              ) : (
                empty
              )}
            </Panel>
          </div>
          <Panel
            title="Quy mô hệ thống"
            subtitle="Số liệu toàn hệ thống, không phụ thuộc bộ lọc thời gian"
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                [
                  'Người dùng',
                  data.overview.users.totalUsers,
                  `${number(data.overview.users.totalActiveUsers)} tài khoản hoạt động`,
                ],
                ['Sinh viên', data.overview.users.totalStudents, 'Toàn hệ thống'],
                ['Cán bộ', data.overview.users.totalStaff, 'Toàn hệ thống'],
                [
                  'Fanpage',
                  data.overview.fanpages.totalFanpages,
                  `${number(data.overview.fanpages.activeFanpages)} đang hoạt động`,
                ],
              ].map(([label, value, detail]) => (
                <div key={label} className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-k2d text-2xl font-semibold tabular-nums">
                    {number(Number(value))}
                  </p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
      <Panel
        title={`Fanpage chờ duyệt (${data?.overview.fanpages.pendingFanpages ?? pendingFanpages.length})`}
      >
        <div className="flex flex-col gap-2">
          {pendingFanpages.length ? (
            pendingFanpages.slice(0, 5).map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="h-auto justify-start whitespace-normal py-2 text-left"
                onClick={() => onReviewFanpage(item)}
              >
                {item.name}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có hồ sơ trong danh sách cần xử lý.
            </p>
          )}
          <Button
            variant="outline"
            className="self-start"
            onClick={() => onNavigateTab('fanpages')}
          >
            Quản lý fanpage
          </Button>
        </div>
      </Panel>
    </div>
  )
}
