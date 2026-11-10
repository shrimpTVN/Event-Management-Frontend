import React from 'react'
import { Sv5tSectionAccordion } from './Sv5tSectionAccordion'
import { Skeleton } from '@/components/ui/skeleton'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tTableProps {
  standards: CriteriaProgressNode[]
  academicYearId?: number
  onSaveProgress: (criteriaId: number, completed: boolean, note: string) => Promise<void> | void
  isLoading?: boolean
  resetKey?: string | number
}

export const Sv5tTable: React.FC<Sv5tTableProps> = ({
  standards,
  academicYearId,
  onSaveProgress,
  isLoading,
  resetKey,
}) => {
  const [, setExpandedStandards] = React.useState<Record<number, boolean>>({})

  // Reset expanded standards when resetKey changes
  React.useEffect(() => {
    setExpandedStandards({})
  }, [resetKey])

  const handleToggleStandard = (criteriaId: number, isExpanded: boolean) => {
    setExpandedStandards((prev) => ({
      ...prev,
      [criteriaId]: isExpanded,
    }))
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-2xs overflow-hidden h-auto animate-pulse">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="w-full min-w-[820px] flex flex-col gap-2">
            {/* Main Dark Navy Table Header */}
            <div className="flex items-stretch bg-[#1B406F] text-white rounded-t-md text-xs font-semibold min-h-[44px] shadow-xs select-none">
              <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0">
                Mã TC
              </div>
              <div className="flex-1 min-w-[280px] px-3 py-2 flex items-center border-r border-white/20">
                Tên tiêu chuẩn
              </div>
              <div className="w-[136px] min-w-[136px] max-w-[136px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
                Dữ liệu ghi nhận
              </div>
              <div className="w-[136px] min-w-[136px] max-w-[136px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
                SV đánh giá
              </div>
              <div className="w-[184px] min-w-[184px] max-w-[184px] px-2 py-2 flex items-center justify-center text-center shrink-0 leading-snug">
                Chi tiết tổng hợp/Tổng
              </div>
            </div>

            {/* 5 Standard Accordion Row Skeletons */}
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
                <div className="flex items-center gap-8 shrink-0 pr-4">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
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
            {/* 1. Mã TC (86px) */}
            <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0">
              Mã TC
            </div>
            {/* 2. Tên tiêu chuẩn (flex-1 min-w-[280px]) */}
            <div className="flex-1 min-w-[280px] px-3 py-2 flex items-center border-r border-white/20">
              Tên tiêu chuẩn
            </div>
            {/* 3. Dữ liệu ghi nhận (136px) */}
            <div className="w-[136px] min-w-[136px] max-w-[136px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
              Dữ liệu ghi nhận
            </div>
            {/* 4. SV đánh giá (136px) */}
            <div className="w-[136px] min-w-[136px] max-w-[136px] px-1 py-2 flex items-center justify-center border-r border-white/20 text-center shrink-0 leading-snug">
              SV đánh giá
            </div>
            {/* 5. Chi tiết tổng hợp/Tổng (184px) */}
            <div className="w-[184px] min-w-[184px] max-w-[184px] px-2 py-2 flex items-center justify-center text-center shrink-0 leading-snug">
              Chi tiết tổng hợp/Tổng
            </div>
          </div>

          {/* Standards Accordions (Tiêu chuẩn 1 đến 5) - Mặc định đóng */}
          {standards.map((std, idx) => (
            <Sv5tSectionAccordion
              key={`${std.criteriaId || idx + 1}-${resetKey ?? ''}`}
              standard={std}
              standardIndex={idx + 1}
              academicYearId={academicYearId}
              onSaveProgress={onSaveProgress}
              defaultExpanded={false}
              onToggleExpand={(expanded) => handleToggleStandard(std.criteriaId, expanded)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
