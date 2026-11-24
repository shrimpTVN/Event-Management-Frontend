import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EChartsReact } from '@/components/ui/EChartsReact'
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
  SuperAdminEvent,
  SuperAdminSemester,
  SuperAdminNavTab,
} from '../types/superAdmin.types'

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-5">
      <h2 className="font-k2d text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}
const empty = <p className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</p>
export function AdminStatisticsDashboard({
  semesters,
  pendingFanpages,
  violatedEvents,
  onNavigateTab,
  onReviewFanpage,
  onModerateEvent,
}: {
  semesters: SuperAdminSemester[]
  pendingFanpages: SuperAdminFanpage[]
  violatedEvents: SuperAdminEvent[]
  onNavigateTab: (tab: SuperAdminNavTab) => void
  onReviewFanpage: (fanpage: SuperAdminFanpage) => void
  onModerateEvent: (event: SuperAdminEvent) => void
}) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [semesterId, setSemesterId] = useState('ALL')
  const [group, setGroup] = useState<'cohorts' | 'schools' | 'majors'>('cohorts')
  const query = useQuery({
    queryKey: ['admin-statistics-dashboard', year, semesterId],
    queryFn: () =>
      adminStatisticsService.getDashboard(year, semesterId === 'ALL' ? undefined : semesterId),
    retry: false,
    staleTime: 60_000,
  })
  const data = query.data
  const trend = data?.monthlyTrends ?? []
  const demographic = data?.demographics[group] ?? []
  return (
    <div className="flex flex-col gap-6 text-left">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-k2d text-2xl font-bold">Tổng quan hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Hoạt động sự kiện năm {year}
            {semesterId !== 'ALL' ? ' · Có lọc học kỳ' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="h-10 w-36" aria-label="Năm thống kê hệ thống">
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
          <Select value={semesterId} onValueChange={setSemesterId}>
            <SelectTrigger className="h-10 w-52" aria-label="Học kỳ thống kê hệ thống">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
              {semesters.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  HK{item.number} · {item.academicYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      {query.isPending ? (
        <p role="status">Đang tải thống kê hệ thống...</p>
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
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              ['Người dùng', data.overview.users.totalUsers, 'Toàn hệ thống'],
              ['Fanpage', data.overview.fanpages.totalFanpages, 'Toàn hệ thống'],
              ['Sự kiện', data.overview.events.totalEvents, 'Trong phạm vi đã chọn'],
              ['Lượt tham dự', data.overview.attendance.totalAttendees, 'Trong phạm vi đã chọn'],
              [
                'Sinh viên',
                data.overview.users.totalStudents,
                `${data.overview.users.totalStaff} cán bộ`,
              ],
              ['Tài khoản hoạt động', data.overview.users.totalActiveUsers, 'Toàn hệ thống'],
              [
                'Lượt đăng ký',
                data.overview.attendance.totalRegistrations,
                `Điểm danh: ${data.overview.attendance.attendanceRate.toLocaleString('vi-VN')}%`,
              ],
              [
                'Lượt vắng',
                data.overview.attendance.absentCount,
                `Tỷ lệ: ${data.overview.attendance.absentRate.toLocaleString('vi-VN')}%`,
              ],
            ].map(([label, value, scope]) => (
              <div
                key={label}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background p-5"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-k2d text-3xl font-bold tabular-nums">
                  {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                </p>
                <p className="text-xs text-muted-foreground">{scope}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Đăng ký và điểm danh theo tháng">
              {trend.some((item) => item.registrationCount || item.attendeeCount) ? (
                <EChartsReact
                  animateOnView
                  option={{
                    color: ['#1B4B8A', '#60A5FA'],
                    animationDuration: 900,
                    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
                    legend: { bottom: 0 },
                    grid: { left: 48, right: 16, bottom: 60 },
                    xAxis: { type: 'category', data: trend.map((item) => item.monthYear) },
                    yAxis: { type: 'value', minInterval: 1 },
                    series: [
                      {
                        name: 'Đăng ký',
                        type: 'bar',
                        data: trend.map((item) => item.registrationCount),
                      },
                      {
                        name: 'Điểm danh',
                        type: 'bar',
                        data: trend.map((item) => item.attendeeCount),
                      },
                    ],
                  }}
                />
              ) : (
                empty
              )}
            </Panel>
            <Panel title="Cơ cấu loại sự kiện">
              {data.eventDistribution.some((item) => item.eventCount > 0) ? (
                <>
                  <EChartsReact
                    animateOnView
                    option={{
                      animationDuration: 900,
                      tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
                      series: [
                        {
                          type: 'pie',
                          radius: ['45%', '70%'],
                          label: { show: false },
                          data: data.eventDistribution.map((item) => ({
                            name: item.eventTypeName,
                            value: item.eventCount,
                          })),
                        },
                      ],
                    }}
                  />
                  <ul className="flex flex-col gap-2 text-sm">
                    {data.eventDistribution.map((item) => (
                      <li
                        key={item.eventTypeId ?? item.eventTypeName}
                        className="flex justify-between gap-3"
                      >
                        <span>{item.eventTypeName}</span>
                        <span>
                          {item.eventCount} · {item.percentage.toLocaleString('vi-VN')}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                empty
              )}
            </Panel>
            <Panel title="Fanpage theo số sự kiện">
              {data.topFanpages.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="p-2">Fanpage</th>
                        <th className="p-2 text-right">Sự kiện</th>
                        <th className="p-2 text-right">Theo dõi</th>
                        <th className="p-2 text-right">Tham dự</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topFanpages.map((item) => (
                        <tr key={item.fanpageId} className="border-b border-border/50">
                          <td className="p-2">
                            <Link
                              to={`/fanpage/${item.fanpageId}`}
                              className="text-primary hover:underline"
                            >
                              {item.fanpageName}
                            </Link>
                          </td>
                          <td className="p-2 text-right">{item.eventCount}</td>
                          <td className="p-2 text-right">{item.followerCount}</td>
                          <td className="p-2 text-right">{item.attendeeCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                empty
              )}
            </Panel>
            <Panel title="Tỷ lệ vắng theo tháng">
              {data.monthlyAbsentRates.some((item) => item.totalRegistrations > 0) ? (
                <EChartsReact
                  animateOnView
                  option={{
                    color: ['#D97706'],
                    animationDuration: 900,
                    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
                    grid: { left: 48, right: 16, bottom: 40 },
                    xAxis: {
                      type: 'category',
                      data: data.monthlyAbsentRates.map((item) => item.monthName),
                    },
                    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
                    series: [
                      {
                        name: 'Tỷ lệ vắng (%)',
                        type: 'bar',
                        data: data.monthlyAbsentRates.map((item) => item.absentRate),
                      },
                    ],
                  }}
                />
              ) : (
                empty
              )}
            </Panel>
          </div>
          <Panel title="Cơ cấu sinh viên đăng ký">
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
                  variant={group === key ? 'secondary' : 'ghost'}
                  aria-pressed={group === key}
                  onClick={() => setGroup(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {demographic.length ? (
              <div className="max-h-96 overflow-auto">
                <ul className="flex flex-col gap-3">
                  {demographic.map((item) => (
                    <li
                      key={item.label}
                      className="flex justify-between gap-4 border-b border-border pb-2 text-sm"
                    >
                      <span>{item.label === 'UNKNOWN' ? 'Chưa xác định' : item.label}</span>
                      <span>
                        {item.count.toLocaleString('vi-VN')} ·{' '}
                        {item.percentage.toLocaleString('vi-VN')}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              empty
            )}
          </Panel>
        </>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title={`Fanpage chờ duyệt (${data?.overview.fanpages.pendingFanpages ?? pendingFanpages.length})`}
        >
          <div className="flex flex-col gap-2">
            {pendingFanpages.slice(0, 5).map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="h-auto justify-start whitespace-normal py-2 text-left"
                onClick={() => onReviewFanpage(item)}
              >
                {item.name}
              </Button>
            ))}
            <Button variant="outline" onClick={() => onNavigateTab('fanpages')}>
              Quản lý fanpage
            </Button>
          </div>
        </Panel>
        <Panel title={`Sự kiện cần xem xét (${violatedEvents.length})`}>
          <div className="flex flex-col gap-2">
            {violatedEvents.slice(0, 5).map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="h-auto justify-start whitespace-normal py-2 text-left"
                onClick={() => onModerateEvent(item)}
              >
                {item.title}
              </Button>
            ))}
            <Button variant="outline" onClick={() => onNavigateTab('events')}>
              Quản lý sự kiện
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
