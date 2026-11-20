import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EChartsReact } from '@/components/ui/EChartsReact'
import type { FanpageSummary } from '../types/fanpageAdmin.types'
import {
  fanpageStatisticsService,
  type FanpageDashboardData,
} from '../services/fanpageStatisticsService'

interface FanpageDashboardViewProps {
  currentFanpage: FanpageSummary
  onCreateEventClick?: () => void
  onEventClick?: (eventId: string) => void
}
const number = (value: number) => value.toLocaleString('vi-VN')
const percent = (value: number) => `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
const subscribeTheme = (notify: () => void) => {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
  return () => observer.disconnect()
}
function Panel({
  title,
  scope,
  children,
  className = '',
}: {
  title: string
  scope: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-k2d text-lg font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{scope}</span>
      </div>
      {children}
    </section>
  )
}
const Empty = () => (
  <p className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
    Chưa có dữ liệu.
  </p>
)

function exportReport(data: FanpageDashboardData, year: number, fanpageId: string) {
  const rows: (string | number)[][] = [
    ['Phạm vi', 'Chỉ số', 'Giá trị'],
    ['Toàn thời gian', 'Tổng sự kiện', data.overview.totalEvents],
    ['Toàn thời gian', 'Lượt đăng ký', data.overview.totalRegistrations],
    ['Toàn thời gian', 'Lượt điểm danh', data.overview.totalAttendees],
    ...(data.overview.totalFollowers === undefined
      ? []
      : [['Hiện tại', 'Người theo dõi', data.overview.totalFollowers]]),
    [],
    ['Tháng', 'Sự kiện', 'Đăng ký', 'Điểm danh'],
    ...data.monthlyTrends.map((item) => [
      item.month,
      item.eventsCount,
      item.registrationsCount,
      item.attendeesCount,
    ]),
    [],
    ['Loại sự kiện (toàn thời gian)', 'Số sự kiện'],
    ...data.eventDistribution.map((item) => [item.eventTypeName, item.eventCount]),
    [],
    ['Top sự kiện (toàn thời gian)', 'Đăng ký', 'Điểm danh', 'Tỷ lệ (%)'],
    ...data.topEvents.map((item) => [
      item.eventName,
      item.totalRegistrations,
      item.totalAttendees,
      item.attendanceRate,
    ]),
    [],
    [`Cơ cấu sinh viên năm ${year}`, 'Nhóm', 'Sinh viên', 'Tỷ lệ (%)'],
    ...(['cohorts', 'schools', 'majors'] as const).flatMap((key, index) =>
      data.demographics[key].map((item) => [
        ['Khóa', 'Khoa / Trường', 'Ngành'][index],
        item.label,
        item.studentCount,
        item.percentage,
      ])
    ),
  ]
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const cell = String(value)
          const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell
          return `"${safe.replaceAll('"', '""')}"`
        })
        .join(',')
    )
    .join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `thong-ke-fanpage-${fanpageId}-${year}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function FanpageDashboardView({
  currentFanpage,
  onCreateEventClick,
  onEventClick,
}: FanpageDashboardViewProps) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [group, setGroup] = useState<'cohorts' | 'schools' | 'majors'>('cohorts')
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains('dark'),
    () => false
  )
  const colors = useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const token = (name: string) => `hsl(${css.getPropertyValue(name).trim()})`
    return {
      primary: token('--primary'),
      text: token('--foreground'),
      muted: token('--muted-foreground'),
      border: token('--border'),
      background: token('--background'),
      secondary: dark ? '#93C5FD' : '#60A5FA',
    }
  }, [dark])
  const query = useQuery({
    queryKey: ['fanpage-statistics-dashboard', currentFanpage.id, year],
    queryFn: () => fanpageStatisticsService.getDashboard(currentFanpage.id, year),
    enabled: Boolean(currentFanpage.id),
    staleTime: 60_000,
    retry: false,
  })
  const data = query.data
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = `${year}-${String(index + 1).padStart(2, '0')}`
        return (
          data?.monthlyTrends.find((item) => item.month === month) ?? {
            month,
            eventsCount: 0,
            registrationsCount: 0,
            attendeesCount: 0,
          }
        )
      }),
    [data, year]
  )
  const trendsOption = useMemo<EChartsOption>(
    () => ({
      textStyle: { fontFamily: 'Readex Pro, sans-serif', color: colors.text },
      color: [colors.primary, colors.secondary],
      aria: { enabled: true },
      tooltip: {
        trigger: 'axis',
        renderMode: 'richText',
        backgroundColor: colors.background,
        borderColor: colors.border,
        textStyle: { color: colors.text, fontFamily: 'Readex Pro' },
      },
      legend: {
        bottom: 0,
        textStyle: { color: colors.muted, fontFamily: 'Readex Pro', fontSize: 12 },
      },
      grid: { left: 8, right: 12, top: 16, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: months.map((_, i) => `Th.${i + 1}`),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted, fontSize: 12, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: colors.muted },
        splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      },
      series: [
        {
          name: 'Đăng ký',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: months.map((item) => item.registrationsCount),
        },
        {
          name: 'Điểm danh',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          data: months.map((item) => item.attendeesCount),
        },
      ],
    }),
    [colors, months]
  )
  const demographics = data?.demographics[group] ?? []
  const demographicOption = useMemo<EChartsOption>(
    () => ({
      textStyle: { fontFamily: 'Readex Pro, sans-serif' },
      aria: { enabled: true },
      tooltip: {
        trigger: 'axis',
        renderMode: 'richText',
        backgroundColor: colors.background,
        borderColor: colors.border,
        textStyle: { color: colors.text, fontFamily: 'Readex Pro' },
      },
      grid: { left: 0, right: 48, top: 8, bottom: 24, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: colors.muted },
        splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: demographics.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: colors.muted, width: 160, overflow: 'truncate', fontSize: 12 },
      },
      series: [
        {
          name: 'Sinh viên đăng ký',
          type: 'bar',
          barMaxWidth: 20,
          data: demographics.map((item) => item.studentCount),
          itemStyle: { color: colors.primary, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: colors.text },
        },
      ],
    }),
    [colors, demographics]
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 text-left font-sans">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-k2d text-2xl font-bold text-foreground md:text-3xl">
            Thống kê fanpage
          </h1>
          <p className="truncate text-sm text-muted-foreground">{currentFanpage.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => data && exportReport(data, year, currentFanpage.id)}
            disabled={!data || query.isError || query.isFetching}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Tải CSV
          </Button>
          {onCreateEventClick && (
            <Button
              onClick={onCreateEventClick}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Tạo sự kiện
            </Button>
          )}
        </div>
      </header>
      {query.isPending ? (
        <div role="status" aria-label="Đang tải thống kê" className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : query.isError || !data ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6"
        >
          <p className="text-sm text-muted-foreground">Không tải được thống kê fanpage.</p>
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-6">
            {[
              {
                title: 'Tổng sự kiện',
                value: number(data.overview.totalEvents),
                scope: 'Toàn thời gian',
              },
              {
                title: 'Lượt đăng ký',
                value: number(data.overview.totalRegistrations),
                scope: 'Toàn thời gian',
              },
              {
                title: 'Tỷ lệ điểm danh',
                value:
                  data.overview.totalRegistrations > 0
                    ? percent(
                        (data.overview.totalAttendees / data.overview.totalRegistrations) * 100
                      )
                    : '—',
                scope: `${number(data.overview.totalAttendees)} lượt điểm danh · Toàn thời gian`,
              },
              {
                title: 'Người theo dõi',
                value:
                  data.overview.totalFollowers === undefined
                    ? '—'
                    : number(data.overview.totalFollowers),
                scope: 'Hiện tại',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="font-k2d text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.scope}</p>
              </div>
            ))}
          </div>
          <Panel title="Đăng ký và điểm danh" scope={`Năm ${year}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Theo tháng diễn ra sự kiện</p>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger aria-label="Năm phân tích" className="h-10 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Năm {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data.monthlyTrends.some((item) => item.eventsCount > 0) ? (
              <EChartsReact option={trendsOption} style={{ height: 300, width: '100%' }} />
            ) : (
              <Empty />
            )}
          </Panel>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="Loại sự kiện" scope="Toàn thời gian">
              {data.eventDistribution.length ? (
                <ul className="flex flex-col gap-4">
                  {data.eventDistribution.map((item) => (
                    <li key={item.eventTypeName} className="flex flex-col gap-2">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words text-foreground">
                          {item.eventTypeName}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {number(item.eventCount)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${data.overview.totalEvents ? (item.eventCount / data.overview.totalEvents) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </Panel>
            <Panel
              title="Sự kiện có nhiều lượt điểm danh"
              scope="Toàn thời gian"
              className="xl:col-span-2"
            >
              {data.topEvents.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Sự kiện</th>
                        <th className="px-3 pb-3 text-right font-medium">Đăng ký</th>
                        <th className="px-3 pb-3 text-right font-medium">Điểm danh</th>
                        <th className="pb-3 pl-3 text-right font-medium">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.topEvents.map((item) => (
                        <tr key={item.eventId}>
                          <td className="min-w-40 py-3 pr-4">
                            <div className="flex flex-col items-start gap-1">
                              {onEventClick ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => onEventClick(String(item.eventId))}
                                  className="h-auto justify-start whitespace-normal p-0 text-left font-medium text-foreground hover:bg-transparent hover:text-primary"
                                >
                                  {item.eventName}
                                </Button>
                              ) : (
                                <span>{item.eventName}</span>
                              )}
                              {item.eventDate && !Number.isNaN(Date.parse(item.eventDate)) && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.eventDate).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {number(item.totalRegistrations)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {number(item.totalAttendees)}
                          </td>
                          <td className="py-3 pl-3 text-right tabular-nums">
                            {item.totalRegistrations ? percent(item.attendanceRate) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty />
              )}
            </Panel>
          </div>
          <Panel
            title="Cơ cấu sinh viên đăng ký"
            scope={`Năm ${year} · Không trùng sinh viên trong từng nhóm`}
          >
            <div role="group" aria-label="Phân nhóm sinh viên" className="flex flex-wrap gap-2">
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
                  onClick={() => setGroup(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {demographics.length ? (
              <div className="max-h-[480px] overflow-y-auto">
                <EChartsReact
                  option={demographicOption}
                  style={{ height: Math.max(220, demographics.length * 40 + 48), width: '100%' }}
                />
              </div>
            ) : (
              <Empty />
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
