import React from 'react'
import { classifyScore } from '../types/trainingPoints.types'

interface TrainingPointsSummaryProps {
  semesterLabel: string
  academicYearLabel: string
  totalScore: number
  maxScore?: number
  activitiesCount?: number
}

export const TrainingPointsSummary: React.FC<TrainingPointsSummaryProps> = ({
  semesterLabel,
  academicYearLabel,
  totalScore,
  maxScore = 100,
  activitiesCount = 0,
}) => {
  const classification = classifyScore(totalScore)

  return (
    <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs">
      {/* Header */}
      <h2 className="text-sm font-semibold text-[#1B4B8A] dark:text-primary tracking-tight">
        {semesterLabel} Năm Học {academicYearLabel}
      </h2>

      {/* Stats container: distributed evenly across 3 columns matching Figma 12-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Stat 1: Tổng điểm hiện có */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Tổng điểm hiện có
          </span>
          <div className="flex items-baseline gap-1.5 font-heading">
            <span className="text-2xl sm:text-3xl font-bold text-[#00AFF0]">
              {totalScore}
            </span>
            <span className="text-sm font-semibold text-foreground/80">
              / {maxScore}
            </span>
          </div>
        </div>

        {/* Stat 2: Xếp loại (không có vạch kẻ phân cách với Cột 1 theo Figma) */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Xếp loại
          </span>
          <span className="text-xl sm:text-2xl font-bold font-heading text-foreground">
            {classification.label}
          </span>
        </div>

        {/* Stat 3: Hoạt động đã tham gia (vạch kẻ phân cách dọc duy nhất ở bên trái) */}
        <div className="flex flex-col gap-1 sm:border-l sm:border-[#E5E7EB] dark:sm:border-border sm:pl-6 md:pl-8 py-0.5">
          <span className="text-xs font-medium text-muted-foreground">
            Hoạt động đã tham gia
          </span>
          <span className="text-base sm:text-lg font-bold font-heading text-foreground/80">
            {activitiesCount > 0 ? activitiesCount : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
