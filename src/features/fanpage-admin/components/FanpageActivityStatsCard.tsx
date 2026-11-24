import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FanpageActivityStats } from '../types/fanpageAdmin.types'

interface Props {
  stats: FanpageActivityStats
  isLoading?: boolean
  onRetry?: () => void
}
export const FanpageActivityStatsCard = ({ stats, isLoading, onRetry }: Props) => (
  <section className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card p-4 text-left shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-1">
      <h3 className="font-k2d text-sm font-semibold text-foreground">Hoạt động</h3>
      <span className="text-[11px] text-muted-foreground">Toàn thời gian</span>
    </div>
    {isLoading ? (
      <Skeleton className="h-20 w-full" />
    ) : stats.available === false ? (
      <div className="flex flex-col items-start gap-1" role="status">
        <p className="text-xs text-muted-foreground">Chưa tải được số liệu.</p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    ) : (
      <dl className="flex flex-col gap-2.5 text-xs">
        {[
          ['Sự kiện', stats.eventsCount],
          ['Lượt đăng ký', stats.totalRegistrations],
          ['Đã điểm danh', stats.totalAttendees],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {typeof value === 'number' ? value.toLocaleString('vi-VN') : '—'}
            </dd>
          </div>
        ))}
      </dl>
    )}
  </section>
)
