import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import React, { useState } from 'react'
import { BadgeCheck, ChevronRight } from 'lucide-react'
import '@/shared/styles/achievementAccordion.css'
import { TrainingPointsRow } from './TrainingPointsRow'
import type {
  PointCategoryNode,
  PointTransaction,
  StudentSemesterPointGroupedTree,
  PointCategoryGroupedTree,
  StudentSemesterPointFlattenedItem,
} from '../types/trainingPoints.types'

interface TrainingPointsSectionAccordionProps {
  section: PointCategoryNode | StudentSemesterPointGroupedTree | PointCategoryGroupedTree
  sectionRoman: string
  transactions?: PointTransaction[]
  studentScores?: Record<number, number>
  studentDescriptions?: Record<number, string>
  semesterId?: number
  onSaveSelfScore: (
    categoryId: number,
    score: number,
    description?: string,
    transactionId?: number
  ) => Promise<void> | void
  onDeleteSelfScore?: (transactionId: number, categoryId: number) => Promise<void> | void
  defaultExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
  aggregateScore?: number
}

export const TrainingPointsSectionAccordion: React.FC<TrainingPointsSectionAccordionProps> = ({
  section,
  sectionRoman,
  semesterId,
  onSaveSelfScore,
  onDeleteSelfScore,
  defaultExpanded = false,
  onToggleExpand,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const contentId = React.useId()
  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    onToggleExpand?.(!isExpanded)
  }
  const server = section as StudentSemesterPointGroupedTree
  const items = server.items ?? []
  const codes = new Map<number, string>()
  const childCounts = new Map<number, number>()
  const rows = items.map((item: StudentSemesterPointFlattenedItem) => {
    const parent = item.parentCategoryId ?? section.id
    const index = (childCounts.get(parent) ?? 0) + 1
    childCounts.set(parent, index)
    const code =
      parent === section.id
        ? `${sectionRoman}.${String.fromCharCode(96 + index)}`
        : `${codes.get(parent) ?? sectionRoman}.${index}`
    codes.set(item.id, code)
    return { item, code }
  })
  const sectionIsLeaf = items.length === 0
  const displaySource = (points: number, maximum: number, isLeaf: boolean) =>
    isLeaf ? points : Math.min(points, maximum)
  const totalRecorded = displaySource(server.systemPointRecord ?? 0, section.maximum, sectionIsLeaf)
  const totalSelf = displaySource(server.manualPointRecord ?? 0, section.maximum, sectionIsLeaf)
  const finalSectionScore = Math.min(section.maximum, server.totalPoint ?? 0)
  const progressPercent = server.completionPercentage ?? 0
  const isMaximumReached = server.isAtMaximum ?? false

  return (
    <div
      ref={sectionRef}
      className="achievement-accordion scroll-mt-4 border border-border rounded-xl overflow-hidden bg-background mb-3"
      data-expanded={isExpanded}
      data-completed={isMaximumReached}
    >
      {/* Accordion Header (Bar Mục I, II, III...) */}
      <Button
        variant="ghost"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        type="button"
        onClick={handleToggle}
        className="achievement-accordion__trigger relative h-auto min-h-[56px] sm:min-h-[64px] rounded-none w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 whitespace-normal cursor-pointer text-left select-none focus-visible:ring-inset"
      >
        <span className="achievement-accordion__heading relative z-10 flex-1 md:flex-none min-w-0 flex flex-col gap-1 text-xs md:text-sm leading-relaxed text-left">
          <span className="font-semibold break-words">{section.name}</span>
          {!isMobile && (
            <span className="achievement-accordion__description text-xs font-normal tabular-nums">
              {finalSectionScore}/{section.maximum} điểm
            </span>
          )}
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {isMobile && (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
              {finalSectionScore}/{section.maximum} điểm
            </span>
          )}
          {isMaximumReached && (
            <span
              role="img"
              aria-label="Đạt điểm tối đa"
              title="Đạt điểm tối đa"
              className="hidden md:flex achievement-accordion__completed h-8 w-6 items-center justify-center"
            >
              <BadgeCheck
                aria-hidden="true"
                className="h-6 w-6 fill-current stroke-white"
                strokeWidth={2}
              />
            </span>
          )}
          <ChevronRight
            aria-hidden="true"
            className="achievement-accordion__chevron h-4 w-4 shrink-0"
          />
        </span>
        <span
          aria-hidden="true"
          className="achievement-accordion__track absolute inset-x-0 bottom-0 z-10 h-[3px]"
        >
          <span
            className="achievement-accordion__progress block h-full origin-left"
            style={{ transform: `scaleX(${progressPercent / 100})` }}
          />
        </span>
      </Button>

      {/* Accordion Content */}
      <div
        id={contentId}
        className="achievement-accordion__body"
        inert={!isExpanded}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="w-full flex flex-col border-t border-border">
            {/* List of criterion rows */}
            {rows.map((row) => (
              <TrainingPointsRow
                key={row.item.id}
                item={row.item}
                criteriaCode={row.code}
                recordedPoints={displaySource(
                  row.item.systemPointRecord ?? 0,
                  row.item.maximum,
                  row.item.isLeaf
                )}
                selfScore={displaySource(
                  row.item.manualPointRecord ?? 0,
                  row.item.maximum,
                  row.item.isLeaf
                )}
                isLeaf={row.item.isLeaf}
                semesterId={semesterId}
                supersededByMax={row.item.contributesToParent === false}
                onSaveSelfScore={onSaveSelfScore}
                onDeleteSelfScore={onDeleteSelfScore}
              />
            ))}

            {/* Bottom Section Total Row ("Cộng điểm mục I") */}
            <div className="student-score-footer training-points-columns flex items-stretch bg-muted/40 border-t border-border font-semibold text-xs min-h-10 tabular-nums">
              {/* Title spans across Tiêu chí (80px) + Tên tiêu chí (flex-1 min-w-[280px]) */}
              <div className="flex-1 min-w-[360px] px-3 flex items-center border-r border-border text-foreground font-k2d">
                Cộng điểm mục {sectionRoman}
              </div>

              {/* Điểm tối đa (96px) */}
              <div className="w-24 min-w-[96px] max-w-[96px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                <span className="student-score-label">Điểm tối đa</span>
                {section.maximum}
              </div>

              {/* Dữ liệu ghi nhận (112px) */}
              <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                <span className="student-score-label">Điểm hệ thống</span>
                {totalRecorded}
              </div>

              {/* SV đánh giá (112px) */}
              <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                <span className="student-score-label">Tự đánh giá</span>
                {totalSelf}
              </div>

              {/* Chi tiết tổng hợp/Tổng (144px) */}
              <div className="w-36 min-w-[144px] max-w-[144px] px-1 flex items-center justify-center text-primary text-center shrink-0 font-bold">
                <span className="student-score-label">Tổng</span>
                {finalSectionScore}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
