import type { FanpageActivityStats } from '../types/fanpageAdmin.types'

interface FanpageActivityStatsCardProps {
  stats: FanpageActivityStats
}

export const FanpageActivityStatsCard: React.FC<FanpageActivityStatsCardProps> = ({ stats }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-5 shadow-xs space-y-4 text-left">
      {/* Header */}
      <div className="space-y-0.5">
        <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground">
          Trạng thái hoạt động
        </h3>
        <p className="text-xs text-[#5B6675] dark:text-muted-foreground">
          {stats.periodLabel}
        </p>
      </div>

      {/* 3 Metric Columns (Figma: Số liệu hoạt động [338x60]) */}
      <div className="grid grid-cols-3 gap-2 py-1">
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

      {/* Divider & Hint Text (Figma: Gợi ý [338x17]) */}
      <div className="pt-3 border-t border-[#F3F4F6] dark:border-border">
        <p className="text-xs text-[#5B6675] dark:text-muted-foreground leading-relaxed">
          Mức phản hồi tin nhắn đạt <strong className="text-foreground">{stats.responseRatePercent}%</strong>. Có{' '}
          <strong className="text-primary">{stats.pendingCommentsCount}</strong> bình luận đang chờ trả lời.
        </p>
      </div>
    </div>
  )
}
