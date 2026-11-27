import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

interface TrainingPointsSummaryProps {
  semesterLabel: string
  academicYearLabel: string
  classificationLabel?: string
  totalScore: number
  maxScore?: number
  activitiesCount?: number
  unavailable?: boolean
  isLoading?: boolean
}

export const TrainingPointsSummary: React.FC<TrainingPointsSummaryProps> = ({
  semesterLabel,
  academicYearLabel,
  totalScore,
  classificationLabel = 'Chưa có dữ liệu',
  maxScore = 100,
  activitiesCount = 0,
  isLoading = false,
  unavailable = false,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const tones: Record<string, string> = {
    'Xuất sắc': 'text-emerald-600',
    Tốt: 'text-blue-600',
    'Trung Bình': 'text-amber-600',
    Yếu: 'text-orange-600',
    Kém: 'text-rose-600',
  }
  const classification = {
    label: classificationLabel,
    color: tones[classificationLabel] ?? 'text-primary',
  }

  if (isLoading) {
    return (
      <div className="bg-background border border-border rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2.5 shadow-2xs animate-pulse">
        <Skeleton className="h-4 w-52 rounded" />
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
            <Skeleton className="h-3 w-36 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="bg-background border border-border rounded-lg p-3.5 flex flex-col gap-2 shadow-2xs">
        {/* Compact year & semester */}
        <div className="text-xs font-medium text-muted-foreground">
          {semesterLabel} · Năm học {academicYearLabel.replace(/\s*-\s*/g, ' - ')}
        </div>

        {/* Score & classification */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
          <div className="flex items-baseline gap-1 font-k2d">
            <span className="text-3xl font-bold text-primary">
              {unavailable ? '——' : totalScore}
            </span>
            <span className="text-sm font-medium text-muted-foreground">/ {maxScore}</span>
          </div>
          <div className="text-sm font-semibold font-k2d text-foreground">
            {unavailable ? '(Chưa có dữ liệu)' : `· ${classification.label}`}
          </div>
        </div>

        {/* Activities count secondary line */}
        <div className="text-xs text-muted-foreground">
          Đã tham gia {activitiesCount > 0 ? `${activitiesCount} hoạt động` : '0 hoạt động'}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border border-border rounded-lg px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2.5 shadow-2xs">
      {/* Header */}
      <h2 className="text-sm font-semibold text-foreground tracking-tight">
        {semesterLabel} Năm Học {academicYearLabel.replace(/\s*-\s*/g, ' - ')}
      </h2>

      {/* Stats container: distributed evenly across 3 columns matching Figma 12-col grid */}
      <div className="student-achievement-stats grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 items-start">
        {/* Stat 1: Tổng điểm hiện có */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Tổng điểm hiện có</span>
          <div className="flex items-baseline gap-1.5 font-k2d">
            <span className="text-2xl sm:text-3xl font-semibold text-primary">
              {unavailable ? '——' : totalScore}
            </span>
            <span className="text-sm font-medium text-foreground/80">/ {maxScore}</span>
          </div>
        </div>

        {/* Stat 2: Xếp loại (không có vạch kẻ phân cách với Cột 1 theo Figma) */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Xếp loại</span>
          <span className="text-xl sm:text-2xl font-semibold font-k2d text-foreground">
            {unavailable ? 'Chưa có dữ liệu' : classification.label}
          </span>
        </div>

        {/* Stat 3: Hoạt động đã tham gia (vạch kẻ phân cách dọc duy nhất ở bên trái) */}
        <div className="flex flex-col gap-1 sm:border-l sm:border-border sm:pl-6 md:pl-8 py-0.5">
          <span className="text-xs font-medium text-muted-foreground">Hoạt động đã tham gia</span>
          <span className="text-base sm:text-lg font-semibold font-k2d text-foreground/80">
            {activitiesCount > 0 ? activitiesCount : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
