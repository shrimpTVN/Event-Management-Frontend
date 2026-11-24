import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EChartsReact } from '@/components/ui/EChartsReact'
import { fanpageStatisticsService } from '../services/fanpageStatisticsService'
import { getAcademicYearAbsentRates } from '../services/academicStatistics'
import type { Semester } from '@/features/training-points/types/trainingPoints.types'

export function FanpageAbsencePanel({
  fanpageId,
  fanpageName,
  year,
  semesterId,
  visibleMonths,
  periodMonths,
  periodLabel,
  academicSemesters,
}: {
  fanpageId: string
  fanpageName: string
  year: number
  semesterId?: string
  visibleMonths?: number[]
  periodMonths?: string[]
  periodLabel?: string
  academicSemesters?: Semester[]
}) {
  const [minimum, setMinimum] = useState('3')
  const validMinimum =
    /^[1-9]\d*$/.test(minimum) &&
    Number.isSafeInteger(Number(minimum)) &&
    Number(minimum) <= 2147483647
  const [selected, setSelected] = useState<number[]>([])
  const [message, setMessage] = useState(
    `Bạn đã vắng nhiều hoạt động của ${fanpageName} trong học kỳ. Vui lòng chú ý tham gia đúng lịch đã đăng ký.`
  )
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null)
  const rates = useQuery({
    queryKey: [
      'fanpage-absent-rates',
      fanpageId,
      year,
      semesterId,
      periodMonths,
      academicSemesters,
    ],
    queryFn: async () => {
      if (academicSemesters && periodMonths)
        return getAcademicYearAbsentRates(fanpageId, academicSemesters, periodMonths)
      const years = periodMonths
        ? [...new Set(periodMonths.map((month) => Number(month.slice(0, 4))))]
        : [year]
      const results = await Promise.all(
        years.map(async (calendarYear) => {
          const rows = await fanpageStatisticsService.getAbsentRates(
            fanpageId,
            calendarYear,
            semesterId
          )
          return rows
            .filter(
              (item) =>
                !periodMonths ||
                periodMonths.includes(`${calendarYear}-${String(item.month).padStart(2, '0')}`)
            )
            .map((item) => ({
              ...item,
              monthName: periodMonths ? `Th.${item.month}/${calendarYear}` : item.monthName,
            }))
        })
      )
      return results.flat()
    },
    retry: false,
  })
  const students = useQuery({
    queryKey: ['fanpage-absent-students', fanpageId, semesterId, minimum],
    queryFn: () =>
      fanpageStatisticsService.getAbsentStudents(fanpageId, semesterId!, Number(minimum)),
    enabled: Boolean(semesterId) && validMinimum,
    retry: false,
  })
  const rows = validMinimum ? (students.data ?? []) : []
  const visibleRates = (rates.data ?? []).filter(
    (item) => !visibleMonths || visibleMonths.includes(item.month)
  )
  const recipients = rows.filter((item) => selected.includes(item.userId))
  const send = async () => {
    if (
      !semesterId ||
      !validMinimum ||
      !recipients.length ||
      !message.trim() ||
      busy ||
      students.isError ||
      students.isFetching
    )
      return
    setBusy(true)
    setFeedback(null)
    try {
      await fanpageStatisticsService.alertAbsentStudents(
        fanpageId,
        semesterId,
        recipients.map((item) => item.userId),
        message.trim()
      )
      setConfirm(false)
      setSelected([])
      setFeedback({ error: false, text: `Đã gửi thông báo đến ${recipients.length} sinh viên.` })
    } catch {
      setFeedback({ error: true, text: 'Chưa gửi được thông báo. Vui lòng thử lại.' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className="flex flex-col gap-5 rounded-xl border border-border bg-background p-4 sm:p-6"
      aria-label="Thống kê vắng mặt"
    >
      <h2 className="font-k2d text-lg font-semibold">Tỷ lệ vắng theo tháng</h2>
      <p className="text-xs text-muted-foreground">
        {periodLabel ?? `Tỷ lệ theo năm ${year}${semesterId ? ' và học kỳ đã chọn' : ''}`}
      </p>
      {rates.isPending ? (
        <p role="status">Đang tải tỷ lệ vắng...</p>
      ) : rates.isError ? (
        <div role="alert" className="flex items-center gap-3">
          <p>Không tải được tỷ lệ vắng.</p>
          <Button variant="outline" onClick={() => void rates.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : visibleRates.some((item) => item.totalRegistrations > 0) ? (
        <EChartsReact
          animateOnView
          option={{
            color: ['#D97706'],
            animationDuration: 900,
            tooltip: {
              trigger: 'axis',
              renderMode: 'richText',
              confine: true,
              formatter: (params: unknown) => {
                const entry = (Array.isArray(params) ? params[0] : params) as
                  { dataIndex?: number } | undefined
                const item = entry?.dataIndex == null ? undefined : visibleRates[entry.dataIndex]
                if (!item) return ''
                return item.totalRegistrations > 0
                  ? `${item.monthName}\nVắng ${item.absentCount.toLocaleString('vi-VN')} / ${item.totalRegistrations.toLocaleString('vi-VN')} lượt đăng ký · ${item.absentRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
                  : `${item.monthName}\nChưa có dữ liệu`
              },
            },
            grid: { left: 12, right: 16, top: 24, bottom: 8, containLabel: true },
            aria: { enabled: true },
            xAxis: {
              type: 'category',
              data: visibleRates.map((item) => item.monthName),
              axisLabel: {
                formatter: (value: string, index: number) =>
                  visibleRates[index]?.totalRegistrations ? value : `${value}\nChưa có dữ liệu`,
              },
            },
            yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
            series: [
              {
                name: 'Tỷ lệ vắng (%)',
                type: 'bar',
                barMaxWidth: 36,
                itemStyle: { borderRadius: [4, 4, 0, 0], opacity: 0.8 },
                data: visibleRates.map((item) =>
                  item.totalRegistrations > 0 ? item.absentRate : null
                ),
              },
            ],
          }}
          style={{ height: 260, width: '100%' }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có dữ liệu vắng mặt trong phạm vi đã chọn.
        </p>
      )}
      {!semesterId ? (
        <p className="text-sm text-muted-foreground">
          Chọn học kỳ để xem sinh viên vắng nhiều lần.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-medium">Sinh viên vắng nhiều lần</h3>
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="absence-minimum" className="whitespace-nowrap">
                Vắng từ
              </Label>
              <Input
                id="absence-minimum"
                aria-label="Số lần vắng tối thiểu"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                inputMode="numeric"
                value={minimum}
                disabled={busy}
                aria-invalid={!validMinimum}
                aria-describedby={!validMinimum ? 'absence-minimum-error' : undefined}
                className="h-9 w-20"
                onChange={(event) => {
                  setMinimum(event.target.value)
                  setSelected([])
                  setConfirm(false)
                  setFeedback(null)
                }}
              />
              <span>lần</span>
            </div>
          </div>
          {!validMinimum ? (
            <p id="absence-minimum-error" role="alert" className="text-sm text-destructive">
              Nhập số nguyên dương hợp lệ.
            </p>
          ) : students.isPending ? (
            <p role="status">Đang tải sinh viên vắng...</p>
          ) : students.isError ? (
            <div role="alert" className="flex items-center gap-3">
              <p>Không tải được danh sách sinh viên.</p>
              <Button variant="outline" onClick={() => void students.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : rows.length ? (
            <>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2">
                        <Input
                          type="checkbox"
                          className="h-4 w-4"
                          aria-label="Chọn tất cả sinh viên"
                          disabled={busy || students.isFetching}
                          checked={rows.every((item) => selected.includes(item.userId))}
                          onChange={(e) =>
                            setSelected(e.target.checked ? rows.map((item) => item.userId) : [])
                          }
                        />
                      </th>
                      <th className="p-2">Sinh viên</th>
                      <th className="p-2 text-right">Số lần vắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.userId} className="border-b border-border/50">
                        <td className="p-2">
                          <Input
                            type="checkbox"
                            className="h-4 w-4"
                            aria-label={`Chọn ${item.fullName}`}
                            disabled={busy || students.isFetching}
                            checked={selected.includes(item.userId)}
                            onChange={(e) =>
                              setSelected((old) =>
                                e.target.checked
                                  ? [...old, item.userId]
                                  : old.filter((id) => id !== item.userId)
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <p className="font-medium">{item.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.studentId || item.email}
                          </p>
                        </td>
                        <td className="p-2 text-right tabular-nums">{item.absenceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-sm text-muted-foreground">
                  {rows.length} sinh viên phù hợp · Đã chọn {recipients.length}
                </p>
                <Button
                  disabled={!recipients.length || busy || students.isFetching}
                  onClick={() => {
                    setFeedback(null)
                    setConfirm(true)
                  }}
                >
                  Nhắc nhở sinh viên đã chọn
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có sinh viên vắng từ {minimum} lần trong học kỳ này.
            </p>
          )}
        </>
      )}
      {feedback && (
        <p
          role={feedback.error ? 'alert' : 'status'}
          className={`text-sm ${feedback.error ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}
        >
          {feedback.text}
        </p>
      )}
      <Dialog.Root
        open={confirm}
        onOpenChange={(value) => {
          if (!busy) setConfirm(value)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-xl border border-border bg-background p-6 shadow-xl">
            <Dialog.Title className="font-k2d text-xl font-semibold">
              Gửi nhắc nhở vắng mặt
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {recipients.length} sinh viên · {fanpageName}
              {periodLabel ? ` · ${periodLabel}` : ' · Học kỳ đã chọn'}
            </Dialog.Description>
            <ul className="max-h-40 overflow-y-auto text-sm">
              {recipients.map((item) => (
                <li key={item.userId}>
                  {item.fullName} · {item.studentId || item.email}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Label htmlFor="absence-message">Nội dung nhắc nhở</Label>
              <Textarea
                id="absence-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={busy}
                rows={4}
              />
            </div>
            {feedback?.error && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.text}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
                Hủy
              </Button>
              <Button
                disabled={
                  busy ||
                  !validMinimum ||
                  students.isFetching ||
                  students.isError ||
                  !recipients.length ||
                  !message.trim()
                }
                onClick={() => void send()}
              >
                {busy ? 'Đang gửi...' : 'Gửi thông báo'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
