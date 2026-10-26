import React from 'react'
import type { HistoryStats } from '../types/history.types'

interface HistoryStatsCardsProps {
  stats?: HistoryStats
  activeFilter?: string
  onSelectFilter?: (filter: 'ALL' | 'UPCOMING' | 'COMPLETED' | 'ABSENT') => void
}

export const HistoryStatsCards: React.FC<HistoryStatsCardsProps> = ({ stats }) => {
  const safeStats = stats || {
    totalRegistered: 0,
    upcoming: 0,
    completed: 0,
    absent: 0,
  }

  const cards = [
    {
      id: 'ALL' as const,
      title: 'Tổng sự kiện đã đăng kí',
      value: safeStats.totalRegistered ?? 0,
      trend: safeStats.totalTrend || {
        value: '+12%',
        isUp: true,
        subText: 'so với kì trước',
      },
      polarity: 'positive' as const,
      showBadge: true,
    },
    {
      id: 'UPCOMING' as const,
      title: 'Sự kiện sắp diễn ra',
      value: safeStats.upcoming ?? 0,
      trend: safeStats.upcomingTrend || {
        value: '',
        isUp: true,
        subText: 'sắp diễn ra',
      },
      polarity: 'neutral' as const,
      showBadge: false, // Bỏ badge cho sự kiện sắp diễn ra theo yêu cầu
    },
    {
      id: 'COMPLETED' as const,
      title: 'Sự kiện đã hoàn thành',
      value: safeStats.completed ?? 0,
      trend: safeStats.completedTrend || {
        value: '+8%',
        isUp: true,
        subText: 'so với kì trước',
      },
      polarity: 'positive' as const,
      showBadge: true,
    },
    {
      id: 'ABSENT' as const,
      title: 'Sự kiện vắng',
      value: safeStats.absent ?? 0,
      trend: safeStats.absentTrend || {
        value: '0%',
        isUp: false,
        subText: 'so với kì trước',
      },
      polarity: 'negative' as const, // Tăng vắng là tiêu cực, giảm vắng là tích cực
      showBadge: true,
    },
  ]

  /**
   * Render badge indicator:
   * - showBadge = false: không hiển thị (ví dụ Sự kiện sắp diễn ra)
   * - Bằng (0% / không đổi): không hiển thị ("bằng thì ko thể hiện")
   * - Polarity 'positive' (chỉ số tích cực):
   *     + Tăng (isUp): tích cực -> Màu xanh lá
   *     + Giảm (!isUp): tiêu cực -> Màu đỏ
   * - Polarity 'negative' (chỉ số tiêu cực như sự kiện vắng):
   *     + Tăng (isUp): tiêu cực (tăng số lần vắng) -> Màu đỏ
   *     + Giảm (!isUp): tích cực (giảm số lần vắng) -> Màu xanh lá
   */
  const renderTrendBadge = (
    trend: { value?: string; isUp?: boolean } | undefined,
    polarity: 'positive' | 'negative' | 'neutral',
    showBadge: boolean
  ) => {
    if (!showBadge || !trend || !trend.value) return null

    const rawVal = trend.value.trim()
    const cleanedNumber = parseFloat(rawVal.replace(/[^\d.-]/g, ''))

    // Giá trị bằng 0% hoặc không xác định -> không thể hiện badge
    if (isNaN(cleanedNumber) || cleanedNumber === 0) {
      return null
    }

    const isUp = trend.isUp ?? cleanedNumber > 0
    const arrow = isUp ? '▲' : '▼'

    // Xác định kết quả tích cực hay tiêu cực
    const isPositiveOutcome = polarity === 'positive' ? isUp : !isUp

    if (isPositiveOutcome) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
          <span>{arrow}</span>
          <span>{trend.value}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400">
        <span>{arrow}</span>
        <span>{trend.value}</span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs select-none"
        >
          {/* Top: Indicator label */}
          <div className="text-xs sm:text-sm font-normal text-[#667085] dark:text-muted-foreground line-clamp-1 mb-2">
            {card.title}
          </div>

          {/* Middle: Big count + Trend pill */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight leading-none">
              {card.value}
            </span>
            {renderTrendBadge(card.trend, card.polarity, card.showBadge)}
          </div>

          {/* Bottom: Subtext comparison */}
          <div className="text-xs text-[#667085] dark:text-muted-foreground truncate">
            {card.trend.subText}
          </div>
        </div>
      ))}
    </div>
  )
}
