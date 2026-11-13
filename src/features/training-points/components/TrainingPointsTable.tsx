import React from 'react'
import { TrainingPointsSectionAccordion } from './TrainingPointsSectionAccordion'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  PointCategoryNode,
  PointTransaction,
  StudentSemesterPointGroupedTree,
  PointCategoryGroupedTree,
} from '../types/trainingPoints.types'

interface TrainingPointsTableProps {
  sections: (PointCategoryNode | StudentSemesterPointGroupedTree | PointCategoryGroupedTree)[]
  transactions?: PointTransaction[]
  studentScores: Record<number, number>
  studentDescriptions?: Record<number, string>
  semesterId?: number
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
  onDeleteSelfScore?: (transactionId: number, categoryId: number) => Promise<void> | void
  isLoading?: boolean
  resetKey?: string | number
  aggregateScores?: Record<number, number>
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V']

export const TrainingPointsTable: React.FC<TrainingPointsTableProps> = ({
  sections,
  transactions = [],
  studentScores,
  studentDescriptions = {},
  semesterId,
  onSaveSelfScore,
  onDeleteSelfScore,
  isLoading,
  resetKey,
  aggregateScores,
}) => {
  const [, setExpandedSections] = React.useState<Record<number, boolean>>({})

  // Reset expanded sections when resetKey changes (e.g. year/semester change)
  React.useEffect(() => {
    setExpandedSections({})
  }, [resetKey])

  const handleToggleSection = (sectionId: number, isExpanded: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: isExpanded,
    }))
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-2xs overflow-hidden h-auto animate-pulse">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="w-full min-w-[820px] flex flex-col gap-2">
            {/* Table Header Skeleton */}
            <div className="flex items-stretch bg-[#1B406F] text-white rounded-t-md text-xs font-semibold min-h-[44px] shadow-xs select-none">
              <div className="w-20 min-w-[80px] max-w-[80px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0">
                Tiêu chí
              </div>
              <div className="flex-1 min-w-[280px] px-3 py-2 flex items-center border-r border-white/20">
                Tên tiêu chí
              </div>
              <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
                Điểm tối đa
              </div>
              <div className="w-28 min-w-[110px] max-w-[110px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
                Điểm hệ thống
              </div>
              <div className="w-28 min-w-[110px] max-w-[110px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
                Sinh viên tự ĐG
              </div>
              <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center text-center shrink-0 leading-snug">
                Điểm kết luận
              </div>
            </div>

            {/* 5 Section Accordion Row Skeletons */}
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-lg gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <Skeleton className="h-4 w-12 rounded shrink-0" />
                  <Skeleton className="h-4 w-72 rounded" />
                </div>
                <div className="flex items-center gap-6 shrink-0 pr-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-2xs overflow-hidden h-auto">
      {/* Scrollable Container for table columns & rows */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="w-full min-w-[820px] flex flex-col">
          {/* Main Dark Navy Table Header */}
          <div className="sticky top-0 z-20 flex items-stretch bg-[#1B406F] text-white rounded-t-md text-xs font-semibold min-h-[44px] mb-2 shadow-xs select-none">
            {/* 1. Tiêu chí (80px) */}
            <div className="w-20 min-w-[80px] max-w-[80px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0">
              Tiêu chí
            </div>
            {/* 2. Tên tiêu chí (flex-1 min-w-[280px]) */}
            <div className="flex-1 min-w-[280px] px-3 py-2 flex items-center border-r border-white/20">
              Tên tiêu chí
            </div>
            {/* 3. Điểm tối đa (96px) */}
            <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
              Điểm tối đa
            </div>
            {/* 4. Dữ liệu ghi nhận (112px) */}
            <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
              Dữ liệu ghi nhận
            </div>
            {/* 5. SV đánh giá (112px) */}
            <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
              SV đánh giá
            </div>
            {/* 6. Chi tiết tổng hợp/Tổng (144px) */}
            <div className="w-36 min-w-[144px] max-w-[144px] px-2 py-2 flex items-center justify-center text-center shrink-0 leading-snug">
              Chi tiết tổng hợp/Tổng
            </div>
          </div>

          {/* Section Accordions (Mục I đến V) */}
          {sections.map((section, idx) => (
            <TrainingPointsSectionAccordion
              key={`${section.id}-${resetKey ?? ''}`}
              section={section}
              sectionRoman={ROMAN_NUMERALS[idx] || String(idx + 1)}
              transactions={transactions}
              studentScores={studentScores}
              studentDescriptions={studentDescriptions}
              semesterId={semesterId}
              onSaveSelfScore={onSaveSelfScore}
              onDeleteSelfScore={onDeleteSelfScore}
              defaultExpanded={false}
              onToggleExpand={(expanded) => handleToggleSection(section.id, expanded)}
              aggregateScore={aggregateScores?.[section.id]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
