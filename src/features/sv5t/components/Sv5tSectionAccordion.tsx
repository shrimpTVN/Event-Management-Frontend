import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import React, { useState } from 'react'
import { BadgeCheck, ChevronRight } from 'lucide-react'
import { Sv5tRow } from './Sv5tRow'
import type { CriteriaProgressNode, CriteriaRowItem } from '../types/sv5t.types'
import '@/shared/styles/achievementAccordion.css'

interface Sv5tSectionAccordionProps {
  standard: CriteriaProgressNode
  standardIndex: number // 1, 2, 3, 4, 5
  academicYearId?: number
  onSaveProgress: (criteriaId: number, completed: boolean, note: string, transactionId?: number) => Promise<void> | void
  onDeleteProgress?: (criteriaTransactionId: number, criteriaId: number) => Promise<void> | void
  defaultExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
}

export const Sv5tSectionAccordion: React.FC<Sv5tSectionAccordionProps> = ({
  standard,
  standardIndex,
  academicYearId,
  onSaveProgress,
  onDeleteProgress,
  defaultExpanded = false,
  onToggleExpand,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const contentId = React.useId()

  const handleToggle = () => {
    const nextState = !isExpanded
    setIsExpanded(nextState)
    onToggleExpand?.(nextState)
    if (!nextState && sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect()
      if (rect.top < 60) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
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
            isLeaf: subChild.isLeaf ?? false,
          })
        })
      } else {
        // Direct leaf row
        list.push({
          node: child,
          code: childCode,
          isLeaf: child.isLeaf ?? false,
        })
      }
    })

    return list
  }, [standard, standardIndex])

  // Required criteria to pass this standard (from backend or default)
  const requiredCount = standard.requiredChildren ?? standard.children.length
  const completedDirect = standard.completedChildren
  const progress = standard.completionPercentage ?? 0

  return (
    <div
      ref={sectionRef}
      className="achievement-accordion scroll-mt-4 border border-border rounded-xl overflow-hidden bg-background"
      data-expanded={isExpanded}
      data-completed={standard.isCompleted}
    >
      {/* Accordion Header */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="achievement-accordion__trigger group relative h-auto min-h-[56px] sm:min-h-[64px] rounded-none w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 whitespace-normal cursor-pointer text-left select-none focus-visible:ring-inset"
      >
        <span className="achievement-accordion__heading relative z-10 flex-1 md:flex-none min-w-0 flex flex-col gap-1 text-xs md:text-sm leading-relaxed text-left">
          <span className="font-semibold break-words">{standard.name}</span>
          {!isMobile && (
            <span className="achievement-accordion__description text-xs font-normal tabular-nums">
              Đã đạt {completedDirect}/{requiredCount} tiêu chí
            </span>
          )}
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {isMobile && (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
              {completedDirect}/{requiredCount} tiêu chí
            </span>
          )}
          {standard.isCompleted ? (
            <span
              role="img"
              aria-label="Đạt tiêu chuẩn"
              title="Đạt tiêu chuẩn"
              className="hidden md:flex achievement-accordion__completed h-8 w-6 items-center justify-center"
            >
              <BadgeCheck
                aria-hidden="true"
                className="h-6 w-6 fill-current stroke-white"
                strokeWidth={2}
              />
            </span>
          ) : (
            <span className="sr-only">Chưa đạt tiêu chuẩn</span>
          )}
          <ChevronRight
            aria-hidden="true"
            className="achievement-accordion__chevron h-4 w-4 shrink-0"
          />
        </span>
        <span
          aria-hidden="true"
          className="achievement-accordion__track absolute inset-x-0 bottom-0 h-[3px]"
        >
          <span
            className="achievement-accordion__progress block h-full origin-left"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </span>
      </Button>

      {/* Accordion Body */}
      <div
        id={contentId}
        className="achievement-accordion__body"
        inert={!isExpanded}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="w-full overflow-x-auto custom-scrollbar border-t border-border">
            <div className="student-score-content min-w-[822px] flex flex-col">
              <div className="student-score-heading flex items-stretch bg-muted/40 text-muted-foreground text-xs font-semibold min-h-10 border-b border-border">
                <div className="w-[86px] shrink-0 px-1 py-2 flex items-center justify-center border-r border-border text-center">
                  Mã TC
                </div>
                <div className="flex-1 min-w-[280px] px-3 py-2 flex items-center border-r border-border">
                  Tên tiêu chí
                </div>
                <div className="w-[136px] shrink-0 px-1 py-2 flex items-center justify-center border-r border-border text-center">
                  Dữ liệu ghi nhận
                </div>
                <div className="w-[136px] shrink-0 px-1 py-2 flex items-center justify-center border-r border-border text-center">
                  SV đánh giá
                </div>
                <div className="w-[184px] shrink-0 px-2 py-2 flex items-center justify-center text-center">
                  Chi tiết
                </div>
              </div>
              {rows.map((r) => (
                <Sv5tRow
                  key={r.node.criteriaId}
                  node={r.node}
                  criteriaCode={r.code}
                  isLeaf={r.isLeaf}
                  isGroupBanner={r.isGroupBanner}
                  academicYearId={academicYearId}
                  onSaveProgress={onSaveProgress}
                  onDeleteProgress={onDeleteProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
