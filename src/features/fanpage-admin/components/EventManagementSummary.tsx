import { CalendarDays, Check, ExternalLink, Link, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, isStudentUser, isSuperAdminUser } from '@/features/auth'
import type { AdminEvent } from '../types/fanpageAdmin.types'

interface EventManagementSummaryProps {
  event: AdminEvent
  status: string
  date: string
  trainingPoints: string[]
  sv5tCriteria: string
  registered: number
  completed: number
  pending: number
  absent: number
  isStudentProof: boolean
  sessionType: 'START' | 'END' | 'BOTH'
  isCopied: boolean
  onBack: () => void
  onCopyLink: () => void
  onEdit?: (event: AdminEvent) => void
  onCloseEvent?: () => void
  closingDisabled?: boolean
}

export function EventManagementSummary({
  event,
  status,
  date,
  trainingPoints,
  sv5tCriteria,
  registered,
  completed,
  pending,
  absent,
  isStudentProof,
  sessionType,
  isCopied,
  onBack,
  onCopyLink,
  onEdit,
  onCloseEvent,
  closingDisabled,
}: EventManagementSummaryProps) {
  const user = useAuthStore((state) => state.user)
  const canViewStudentPage = isStudentUser(user) && !isSuperAdminUser(user)
  const registrationDate = (value?: string) => {
    if (!value) return 'Chưa cập nhật'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Chưa cập nhật'
    return parsed.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(!/^\d{4}-\d{2}-\d{2}$/.test(value)
        ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false }
        : {}),
      timeZone: 'Asia/Ho_Chi_Minh',
    })
  }
  const percentage = (value: number, total: number) =>
    total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0
  const statusLabel =
    status === 'PUBLISHED'
      ? 'Đang mở'
      : status === 'CLOSED' || status === 'COMPLETED'
        ? 'Đã kết thúc'
        : status === 'CANCELLED'
          ? 'Đã hủy'
          : 'Bản nháp'
  return (
    <>
      <div className="flex flex-col gap-1">
        <nav aria-label="Đường dẫn trang" className="text-xs font-medium text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>Quản trị fanpage</li>
            <li aria-hidden="true">/</li>
            <li>
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                aria-label="Quay lại danh sách sự kiện"
                className="h-auto rounded-sm p-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-primary"
              >
                Sự kiện
              </Button>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-primary">
              Chi tiết sự kiện
            </li>
          </ol>
        </nav>
        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <h1 className="font-k2d text-2xl font-bold text-foreground">Chi tiết sự kiện</h1>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(event)}
                className="gap-2 self-start sm:self-auto"
              >
                <Pencil className="h-4 w-4" />
                Chỉnh sửa sự kiện
              </Button>
            )}
            {onCloseEvent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCloseEvent}
                disabled={closingDisabled}
                className="border-[#C2412D] text-[#C2412D] hover:border-[#A93625] hover:bg-[#A93625] hover:text-white focus-visible:ring-[#C2412D]/30 dark:border-[#C2412D] dark:text-[#F2A08F] dark:hover:border-[#A93625] dark:hover:bg-[#A93625] dark:hover:text-white"
              >
                Kết thúc sự kiện
              </Button>
            )}
          </div>
        </div>
      </div>

      <section
        aria-label="Thông tin sự kiện"
        className="flex flex-col gap-5 rounded-xl border border-border bg-white p-4 dark:bg-card sm:p-6"
      >
        <div className="flex flex-col gap-5 md:flex-row-reverse md:items-start">
          <div className="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 md:w-44 lg:w-52">
            {event.bannerUrl ? (
              <img
                src={event.bannerUrl}
                alt={event.name}
                className="max-h-64 w-full object-contain"
              />
            ) : (
              <CalendarDays className="m-10 h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${status === 'PUBLISHED' ? 'bg-emerald-500' : status === 'CANCELLED' ? 'bg-destructive' : 'bg-muted-foreground'}`}
                  />
                  {statusLabel}
                </span>
                <span>{event.eventTypeName || 'Sự kiện'}</span>
                {event.code && <span>#{event.code}</span>}
              </div>
              <h2 className="break-words font-k2d text-xl font-semibold leading-snug text-foreground">
                {event.name}
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Thời gian</dt>
                <dd className="font-medium">
                  {event.timeStart}–{event.timeEnd} · {date}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Địa điểm</dt>
                <dd className="break-words font-medium">{event.location || 'Chưa cập nhật'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Mở đăng ký</dt>
                <dd>{registrationDate(event.dateOpen)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Đóng đăng ký</dt>
                <dd>{registrationDate(event.dateClose)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Hình thức điểm danh</dt>
                <dd>{isStudentProof ? 'Sinh viên nộp minh chứng' : 'Ban tổ chức điểm danh'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Phiên điểm danh</dt>
                <dd>
                  {sessionType === 'BOTH'
                    ? 'Đầu giờ và cuối giờ'
                    : sessionType === 'START'
                      ? 'Đầu giờ'
                      : 'Cuối giờ'}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              {canViewStudentPage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/events/${event.id}`, '_blank')}
                  className="gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem trang sự kiện
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCopyLink}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
                {isCopied ? 'Đã sao chép' : 'Sao chép liên kết'}
              </Button>
            </div>
          </div>
        </div>
        {(trainingPoints.length > 0 || sv5tCriteria || event.hasCertificate) && (
          <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
            {trainingPoints.length > 0 && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Điểm rèn luyện</dt>
                <dd className="flex flex-col gap-2 text-muted-foreground">
                  {trainingPoints.map((point, index) => (
                    <span key={index}>{point}</span>
                  ))}
                </dd>
              </div>
            )}
            {sv5tCriteria && (
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Sinh viên 5 tốt</dt>
                <dd className="break-words leading-relaxed text-muted-foreground">
                  {sv5tCriteria}
                </dd>
              </div>
            )}
            {event.hasCertificate && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">Chứng nhận</dt>
                <dd>Có cấp giấy chứng nhận</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section
        aria-label="Thống kê tham gia"
        className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-white dark:bg-card sm:grid-cols-3"
      >
        {[
          {
            label: 'Đã đăng ký',
            value: registered,
            percentage: percentage(registered, event.capacity),
            detail: `Chỉ tiêu: ${event.capacity ?? '—'} sinh viên`,
          },
          {
            label: 'Đã hoàn thành',
            value: completed,
            percentage: percentage(completed, registered),
            detail: `${registered > 0 ? Math.round((completed / registered) * 100) : 0}% đã đăng ký`,
          },
          {
            label: isStudentProof ? 'Chờ duyệt minh chứng' : 'Chưa điểm danh',
            value: pending,
            percentage: percentage(pending, registered),
            detail: `${absent} sinh viên vắng mặt`,
          },
        ].map((metric, index) => (
          <div
            key={metric.label}
            className={`flex flex-col gap-1.5 p-4 sm:p-5 ${index > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''}`}
          >
            <h3 className="text-xs font-medium text-muted-foreground">{metric.label}</h3>
            <p className="font-k2d text-2xl font-semibold tabular-nums text-foreground">
              {metric.value}
            </p>
            <div
              role="progressbar"
              aria-label={metric.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={metric.percentage}
              className="my-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary/65 transition-[width]"
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </section>
    </>
  )
}
