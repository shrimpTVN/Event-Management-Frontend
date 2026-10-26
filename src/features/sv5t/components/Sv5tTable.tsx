import React from 'react'
import { Sv5tSectionAccordion } from './Sv5tSectionAccordion'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tTableProps {
  standards: CriteriaProgressNode[]
  onSaveProgress: (criteriaId: number, completed: boolean, note: string) => Promise<void> | void
  isLoading?: boolean
  resetKey?: string | number
}

export const Sv5tTable: React.FC<Sv5tTableProps> = ({
  standards,
  onSaveProgress,
  isLoading,
  resetKey,
}) => {
  const [expandedStandards, setExpandedStandards] = React.useState<Record<number, boolean>>({})

  // Reset expanded standards when resetKey changes
  React.useEffect(() => {
    setExpandedStandards({})
  }, [resetKey])

  const hasAnyExpanded = React.useMemo(() => {
    return Object.values(expandedStandards).some(Boolean)
  }, [expandedStandards])

  const handleToggleStandard = (criteriaId: number, isExpanded: boolean) => {
    setExpandedStandards((prev) => ({
      ...prev,
      [criteriaId]: isExpanded,
    }))
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-6 flex flex-col gap-4 animate-pulse shadow-2xs h-auto shrink-0">
        <div className="h-9 bg-muted/60 rounded" />
        <div className="h-44 bg-muted/40 rounded" />
        <div className="h-12 bg-muted/30 rounded" />
        <div className="h-12 bg-muted/30 rounded" />
      </div>
    )
  }

  return (
    <div
      className={`bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-2xs overflow-hidden ${
        hasAnyExpanded ? 'flex-1 min-h-[360px] md:min-h-0' : 'h-auto shrink-0'
      }`}
    >
      {/* Scrollable Container for table columns & rows */}
      <div
        className={`w-full overflow-x-auto custom-scrollbar ${
          hasAnyExpanded ? 'flex-1 min-h-0 overflow-y-auto' : ''
        }`}
      >
        <div className="min-w-[820px] flex flex-col">
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
              key={`${std.criteriaId}-${resetKey ?? ''}`}
              standard={std}
              standardIndex={idx + 1}
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
