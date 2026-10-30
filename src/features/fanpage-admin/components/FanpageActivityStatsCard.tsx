import type { FanpageActivityStats } from '../types/fanpageAdmin.types'

interface FanpageActivityStatsCardProps {
  stats: FanpageActivityStats
}

export const FanpageActivityStatsCard: React.FC<FanpageActivityStatsCardProps> = ({ stats }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-xl border border-border/50 dark:border-border/60 p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] space-y-4 text-left">
      {/* Header with Title and Period Label on the same row */}
      <div className="flex items-center justify-between">
        <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground">
          Trạng thái hoạt động
        </h3>
        <span className="text-xs text-[#5B6675] dark:text-muted-foreground font-normal">
          {stats.periodLabel}
        </span>
      </div>

      {/* 3 Metric Columns (Figma: Số liệu hoạt động [338x60]) */}
      <div className="grid grid-cols-3 gap-2 py-0.5">
        {/* Metric 1 */}
        <div className="p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-background/80 border border-[#E5E7EB] dark:border-border text-center">
          <p className="font-k2d font-bold text-lg text-primary">
            {stats.eventsCount < 10 ? `0${stats.eventsCount}` : stats.eventsCount}
          </p>
          <p className="text-[11px] text-[#5B6675] dark:text-muted-foreground mt-0.5">
            Sự kiện
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-background/80 border border-[#E5E7EB] dark:border-border text-center">
          <p className="font-k2d font-bold text-lg text-primary">
            {stats.interactionsCount}
          </p>
          <p className="text-[11px] text-[#5B6675] dark:text-muted-foreground mt-0.5">
            Tương tác
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-background/80 border border-[#E5E7EB] dark:border-border text-center">
          <p className="font-k2d font-bold text-lg text-primary">
            {stats.newFollowersCount}
          </p>
          <p className="text-[11px] text-[#5B6675] dark:text-muted-foreground mt-0.5">
            Theo dõi mới
          </p>
        </div>
      </div>
    </div>
  )
}
