import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Sv5tRow } from './Sv5tRow'
import type { CriteriaProgressNode, CriteriaRowItem } from '../types/sv5t.types'

interface Sv5tSectionAccordionProps {
  standard: CriteriaProgressNode
  standardIndex: number // 1, 2, 3, 4, 5
  onSaveProgress: (criteriaId: number, completed: boolean, note: string) => Promise<void> | void
  defaultExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
}

export const Sv5tSectionAccordion: React.FC<Sv5tSectionAccordionProps> = ({
  standard,
  standardIndex,
  onSaveProgress,
  defaultExpanded = false,
  onToggleExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionRef = React.useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const nextState = !isExpanded
    setIsExpanded(nextState)
    onToggleExpand?.(nextState)
  }

  // Flatten direct and nested children into printable rows with codes like 1.1, 1.2, 1.3, 1.3.1
  const rows: CriteriaRowItem[] = React.useMemo(() => {
    const list: CriteriaRowItem[] = []

    standard.children.forEach((child, idx) => {
      const childCode = `${standardIndex}.${idx + 1}`

      // Check if this child has nested children (e.g. 1.3 has 1.3.1 to 1.3.5)
      if (child.children && child.children.length > 0) {
        // Group banner row
        list.push({
          node: child,
          code: childCode,
          isLeaf: false,
          isGroupBanner: true,
        })
        // Sub-criteria rows
        child.children.forEach((subChild, subIdx) => {
          list.push({
            node: subChild,
            code: `${childCode}.${subIdx + 1}`,
            isLeaf: true,
          })
        })
      } else {
        // Direct leaf row
        list.push({
          node: child,
          code: childCode,
          isLeaf: true,
        })
      }
    })

    return list
  }, [standard, standardIndex])

  // Required criteria to pass this standard (from backend or default)
  const requiredCount = standard.requiredChildren ?? standard.children.length
  const completedDirect = standard.completedChildren

  return (
    <div
      ref={sectionRef}
      className="scroll-mt-4 border border-[#E5E7EB] dark:border-border rounded-md overflow-hidden bg-white dark:bg-card mb-3 shadow-2xs"
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#EFF5FC] dark:bg-primary/10 hover:bg-[#E2EEFB] dark:hover:bg-primary/15 transition-colors cursor-pointer text-left select-none border-b border-[#E5E7EB] dark:border-border"
      >
        {/* Left: Chevron & Standard Title */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
          )}
          <span className="font-semibold text-xs sm:text-sm text-[#1B4B8A] dark:text-primary truncate">
            {standard.name}
          </span>
        </div>

        {/* Right: Status badge & Dot indicators */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status badge: Đạt / Chưa đạt */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              standard.isCompleted
                ? 'bg-[#F0FDF4] dark:bg-emerald-950/50 text-[#15803D] dark:text-emerald-300'
                : 'bg-[#E5E7EB] dark:bg-muted text-[#6B7280] dark:text-muted-foreground'
            }`}
          >
            {standard.isCompleted ? 'Đạt' : 'Chưa đạt'}
          </span>

          {/* Indicator dots: dấu chấm là số lượng tiêu chí, số lượng là đã đạt / cần đạt */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {standard.children.map((child) => (
                <span
                  key={child.criteriaId}
                  title={`${child.name}: ${child.isCompleted ? 'Đạt' : 'Chưa đạt'}`}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                    child.isCompleted
                      ? 'bg-[#15803D] dark:bg-emerald-400 border border-[#15803D]'
                      : 'bg-[#D1D5DB] dark:bg-muted-foreground/40 border border-[#D1D5DB] dark:border-border'
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-xs font-semibold ml-1 font-heading ${
                standard.isCompleted
                  ? 'text-[#15803D] dark:text-emerald-400 font-bold'
                  : 'text-[#6B7280] dark:text-muted-foreground'
              }`}
            >
              {completedDirect}/{requiredCount}
            </span>
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="w-full flex flex-col">
          {rows.map((r) => (
            <Sv5tRow
              key={r.node.criteriaId}
              node={r.node}
              criteriaCode={r.code}
              isLeaf={r.isLeaf}
              isGroupBanner={r.isGroupBanner}
              onSaveProgress={onSaveProgress}
            />
          ))}

          {/* Bottom Result Row: Kết quả tiêu chuẩn */}
          <div
            className={`flex items-center justify-center py-2 px-4 border-t border-[#E5E7EB] dark:border-border text-xs font-semibold ${
              standard.isCompleted
                ? 'bg-[#F0FDF4] dark:bg-emerald-950/25 text-[#15803D] dark:text-emerald-300'
                : 'bg-[#F9FAFB] dark:bg-muted/40 text-muted-foreground'
            }`}
          >
            Kết quả tiêu chuẩn: {standard.isCompleted ? 'Đạt' : 'Chưa đạt'}
          </div>
        </div>
      )}
    </div>
  )
}
