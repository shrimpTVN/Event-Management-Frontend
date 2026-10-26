import React from 'react'
import type { EvaluationScope } from '../types/sv5t.types'

interface Sv5tSummaryProps {
  academicYearLabel: string
  completedStandardsCount: number
  totalStandardsCount?: number
  scope: EvaluationScope
}

export const Sv5tSummary: React.FC<Sv5tSummaryProps> = ({
  academicYearLabel,
  completedStandardsCount,
  totalStandardsCount = 5,
  scope,
}) => {
  const isEligible = completedStandardsCount >= totalStandardsCount

  return (
    <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2.5 shadow-2xs">
      {/* Header */}
      <h2 className="text-sm font-semibold text-[#1B4B8A] dark:text-primary tracking-tight">
        Năm Học {academicYearLabel}
      </h2>

      {/* 3 Columns evenly distributed matching Figma 12-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Stat 1: Tiêu chuẩn đã đạt */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Tiêu chuẩn đã đạt
          </span>
          <div className="flex items-baseline gap-1.5 font-heading">
            <span className="text-2xl sm:text-3xl font-semibold text-[#00AFF0]">
              {completedStandardsCount}
            </span>
            <span className="text-sm font-medium text-foreground/80">
              / {totalStandardsCount}
            </span>
          </div>
        </div>

        {/* Stat 2: Cấp xét */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Cấp xét
          </span>
          <span className="text-xl sm:text-2xl font-semibold font-heading text-foreground">
            {scope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Khoa'}
          </span>
        </div>

        {/* Stat 3: Trạng thái (với vạch ngăn cách dọc duy nhất ở bên trái) */}
        <div className="flex flex-col gap-1 sm:border-l sm:border-[#E5E7EB] dark:sm:border-border sm:pl-6 md:pl-8 py-0.5">
          <span className="text-xs font-medium text-muted-foreground">
            Trạng thái
          </span>
          <span
            className={`text-xl sm:text-2xl font-semibold font-heading ${
              isEligible ? 'text-[#15803D] dark:text-emerald-400' : 'text-foreground'
            }`}
          >
            {isEligible ? 'Đủ điều kiện xét chọn' : 'Chưa đủ điều kiện'}
          </span>
        </div>
      </div>
    </div>
  )
}
