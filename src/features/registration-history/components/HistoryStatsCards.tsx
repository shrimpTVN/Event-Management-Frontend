import React from 'react'
import type { HistoryStats } from '../types/history.types'

interface HistoryStatsCardsProps {
  stats: HistoryStats
  activeFilter?: string
  onSelectFilter?: (filter: 'ALL' | 'UPCOMING' | 'COMPLETED' | 'ABSENT') => void
}

export const HistoryStatsCards: React.FC<HistoryStatsCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'ALL' as const,
      title: 'Tổng sự kiện đã đăng kí',
      value: stats.totalRegistered,
      trend: stats.totalTrend || {
        value: '20%',
        isUp: true,
        subText: 'So với HK3 NH 2025 - 2026',
      },
      trendVariant: 'success' as const,
    },
    {
      id: 'UPCOMING' as const,
      title: 'Sự kiện sắp diễn ra',
      value: stats.upcoming,
      trend: stats.upcomingTrend || {
        value: '—%',
        isUp: true,
        subText: 'SK gần nhất: 8h 20/10',
      },
      trendVariant: 'neutral' as const,
    },
    {
      id: 'COMPLETED' as const,
      title: 'Sự kiện đã hoàn thành',
      value: stats.completed,
      trend: stats.completedTrend || {
        value: '—%',
        isUp: true,
        subText: 'So với HK3 NH 2025 - 2026',
      },
      trendVariant: 'neutral' as const,
    },
    {
      id: 'ABSENT' as const,
      title: 'Sự kiện vắng',
      value: stats.absent,
      trend: stats.absentTrend || {
        value: '—%',
        isUp: false,
        subText: 'So với HK3 NH 2025 - 2026',
      },
      trendVariant: 'danger' as const,
    },
  ]

  const getTrendBadge = (trend: { value: string; isUp?: boolean }, variant: 'success' | 'neutral' | 'danger') => {
    const arrow = trend.isUp ? '▲' : '▼'

    if (variant === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
          <span>{arrow}</span>
          <span>{trend.value}</span>
        </span>
      )
    }

    if (variant === 'danger') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400">
          <span>{arrow}</span>
          <span>{trend.value}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-muted dark:text-muted-foreground">
        <span>{arrow}</span>
        <span>{trend.value}</span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter?.(card.id)}
            className={`flex flex-col justify-between p-4 sm:p-5 rounded-lg bg-white dark:bg-card border transition-all text-left group hover:shadow-xs ${
              isActive
                ? 'border-[#1B4B8A] ring-1 ring-[#1B4B8A] bg-blue-50/10 dark:bg-blue-950/10'
                : 'border-border/80 hover:border-[#1B4B8A]/40'
            }`}
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
              {getTrendBadge(card.trend, card.trendVariant)}
            </div>

            {/* Bottom: Subtext comparison */}
            <div className="text-xs text-[#667085] dark:text-muted-foreground truncate">
              {card.trend.subText}
            </div>
          </button>
        )
      })}
    </div>
  )
}
