import React from 'react'
import type { EvaluationScope } from '../types/sv5t.types'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

interface Sv5tSummaryProps {
  academicYearLabel: string
  completedStandardsCount: number
  totalStandardsCount?: number
  scope: EvaluationScope
  unavailable?: boolean
  isLoading?: boolean
}

export const Sv5tSummary: React.FC<Sv5tSummaryProps> = ({
  academicYearLabel,
  completedStandardsCount,
  totalStandardsCount = 5,
  scope,
  isLoading = false,
  unavailable = false,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isEligible = completedStandardsCount >= totalStandardsCount

  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2.5 shadow-2xs animate-pulse">
        <Skeleton className="h-4 w-44 rounded" />
        <div className="student-achievement-stats grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 items-start pt-1">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-7 w-24 rounded" />
          </div>
          <div className="flex flex-col gap-1.5 sm:border-l sm:border-border sm:pl-6 md:pl-8 py-0.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-32 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2.5 shadow-2xs">
        {/* Compact year & scope */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Năm học {academicYearLabel.replace(/\s*-\s*/g, ' - ')}</span>
          <span className="font-medium text-foreground">
            {scope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Khoa'}
          </span>
        </div>

        {/* Standard count & status */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 font-k2d">
          <span className="text-3xl font-bold text-primary">
            {unavailable ? '——' : completedStandardsCount}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            / {totalStandardsCount} tiêu chuẩn
          </span>
          {!unavailable && (
            <span
              className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                isEligible
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isEligible ? 'Đủ điều kiện (tham khảo)' : 'Chưa đủ điều kiện (tham khảo)'}
            </span>
          )}
        </div>

        {/* Small progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{
              width: `${
                unavailable
                  ? 0
                  : Math.min(
                      100,
                      Math.max(0, (completedStandardsCount / totalStandardsCount) * 100)
                    )
              }%`,
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border border-border rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2.5 shadow-2xs">
      {/* Header */}
      <h2 className="text-sm font-semibold text-foreground tracking-tight">
        Năm Học {academicYearLabel.replace(/\s*-\s*/g, ' - ')}
      </h2>

      {/* 3 Columns evenly distributed matching Figma 12-col grid */}
      <div className="student-achievement-stats grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 items-start">
        {/* Stat 1: Tiêu chuẩn đã đạt */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Tiêu chuẩn đã đạt</span>
          <div className="flex items-baseline gap-1.5 font-k2d">
            <span className="text-2xl sm:text-3xl font-semibold text-primary">
              {unavailable ? '——' : completedStandardsCount}
            </span>
            <span className="text-sm font-medium text-foreground/80">/ {totalStandardsCount}</span>
          </div>
        </div>

        {/* Stat 2: Cấp xét */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Cấp xét</span>
          <span className="text-xl sm:text-2xl font-semibold font-k2d text-foreground">
            {scope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Khoa'}
          </span>
        </div>

        {/* Stat 3: Trạng thái (với vạch ngăn cách dọc duy nhất ở bên trái) */}
        <div className="flex flex-col gap-1 sm:border-l sm:border-border sm:pl-6 md:pl-8 py-0.5">
          <span className="text-xs font-medium text-muted-foreground">Trạng thái</span>
          <span
            className={`text-xl sm:text-2xl font-semibold font-k2d ${
              isEligible ? 'text-[#0F766E] dark:text-teal-300' : 'text-foreground'
            }`}
          >
            {unavailable
              ? 'Chưa có dữ liệu'
              : isEligible
                ? 'Đủ điều kiện xét chọn'
                : 'Chưa đủ điều kiện'}
          </span>
        </div>
      </div>
    </div>
  )
}
