import React from 'react'
import { TrainingPointsSectionAccordion } from './TrainingPointsSectionAccordion'
import type { PointCategoryNode, PointTransaction } from '../types/trainingPoints.types'

interface TrainingPointsTableProps {
  sections: PointCategoryNode[]
  transactions: PointTransaction[]
  studentScores: Record<number, number>
  studentDescriptions?: Record<number, string>
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
  isLoading?: boolean
  resetKey?: string | number
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V']

export const TrainingPointsTable: React.FC<TrainingPointsTableProps> = ({
  sections,
  transactions,
  studentScores,
  studentDescriptions = {},
  onSaveSelfScore,
  isLoading,
  resetKey,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-6 flex flex-col gap-4 animate-pulse shadow-2xs">
        <div className="h-9 bg-muted/60 rounded" />
        <div className="h-48 bg-muted/40 rounded" />
        <div className="h-12 bg-muted/30 rounded" />
        <div className="h-12 bg-muted/30 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-2xs overflow-hidden">
      {/* Scrollable Container for table columns */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[820px] flex flex-col">
          {/* Main Dark Navy Table Header */}
          <div className="flex items-stretch bg-[#1B406F] text-white rounded-t-md text-xs font-semibold min-h-[44px] mb-2 shadow-2xs select-none">
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
              onSaveSelfScore={onSaveSelfScore}
              defaultExpanded={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
