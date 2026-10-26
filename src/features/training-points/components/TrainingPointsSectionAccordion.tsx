import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TrainingPointsRow } from './TrainingPointsRow'
import type { PointCategoryNode, PointTransaction } from '../types/trainingPoints.types'

interface TrainingPointsSectionAccordionProps {
  section: PointCategoryNode
  sectionRoman: string // 'I', 'II', 'III', 'IV', 'V'
  transactions: PointTransaction[]
  studentScores: Record<number, number>
  studentDescriptions?: Record<number, string>
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
  defaultExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
}

export const TrainingPointsSectionAccordion: React.FC<TrainingPointsSectionAccordionProps> = ({
  section,
  sectionRoman,
  transactions,
  studentScores,
  studentDescriptions = {},
  onSaveSelfScore,
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

  // Map of categoryId -> recorded points from events/system
  const recordedMap = React.useMemo(() => {
    const map = new Map<number, number>()
    transactions.forEach((tx) => {
      if (tx.type !== 'MANUAL') {
        const cur = map.get(tx.pointCategoryId) || 0
        map.set(tx.pointCategoryId, cur + tx.points)
      }
    })
    return map
  }, [transactions])

  // Map of categoryId -> recorded event/system transactions
  const recordedTxMap = React.useMemo(() => {
    const map = new Map<number, PointTransaction[]>()
    transactions.forEach((tx) => {
      if (tx.type !== 'MANUAL') {
        const list = map.get(tx.pointCategoryId) || []
        list.push(tx)
        map.set(tx.pointCategoryId, list)
      }
    })
    return map
  }, [transactions])

  // Map of categoryId -> manual self-evaluation description from transactions
  const selfTxDescriptionMap = React.useMemo(() => {
    const map = new Map<number, string>()
    transactions.forEach((tx) => {
      if (tx.type === 'MANUAL' && tx.description) {
        map.set(tx.pointCategoryId, tx.description)
      }
    })
    return map
  }, [transactions])

  // Flatten rows to render in sequence with generated codes like I.a, I.a.1, I.a.2.1
  const rows = React.useMemo(() => {
    const list: Array<{
      item: PointCategoryNode
      code: string
      isLeaf: boolean
    }> = []

    function traverse(node: PointCategoryNode, parentCode: string, depth: number) {
      if (!node.children || node.children.length === 0) {
        list.push({ item: node, code: parentCode, isLeaf: true })
        return
      }

      // Group header
      list.push({ item: node, code: parentCode, isLeaf: false })

      node.children.forEach((child, idx) => {
        const childCode =
          depth === 1
            ? `${parentCode}.${String.fromCharCode(97 + idx)}`
            : `${parentCode}.${idx + 1}`
        traverse(child, childCode, depth + 1)
      })
    }

    if (section.children) {
      section.children.forEach((child, idx) => {
        const char = String.fromCharCode(97 + idx)
        traverse(child, `${sectionRoman}.${char}`, 2)
      })
    }

    return list
  }, [section, sectionRoman])

  // Calculate sum of recorded points & student scores for this whole section
  const { totalRecorded, totalSelf } = React.useMemo(() => {
    let rec = 0
    let self = 0

    rows.forEach((r) => {
      if (r.isLeaf) {
        rec += recordedMap.get(r.item.id) || 0
        self += studentScores[r.item.id] || 0
      }
    })

    return { totalRecorded: rec, totalSelf: self }
  }, [rows, recordedMap, studentScores])

  // Final section score capped at section.maximum
  const finalSectionScore = Math.min(section.maximum, totalRecorded + totalSelf)
  const progressPercent = section.maximum > 0
    ? Math.min(100, Math.round((finalSectionScore / section.maximum) * 100))
    : 0

  return (
    <div
      ref={sectionRef}
      className="scroll-mt-4 border border-[#E5E7EB] dark:border-border rounded-md overflow-hidden bg-white dark:bg-card mb-3 shadow-2xs"
    >
      {/* Accordion Header (Bar Mục I, II, III...) */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#EFF5FC] dark:bg-primary/10 hover:bg-[#E2EEFB] dark:hover:bg-primary/15 transition-colors cursor-pointer text-left select-none border-b border-[#E5E7EB] dark:border-border"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
          )}
          <span className="font-semibold text-xs sm:text-sm text-[#1B4B8A] dark:text-primary truncate">
            {section.name}
          </span>
        </div>

        {/* Right side: Score badge & progress bar */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-xs text-[#008CCC] dark:text-cyan-400 whitespace-nowrap">
            {finalSectionScore}/{section.maximum} điểm
          </span>

          {/* Mini progress bar (width 120px to 200px) */}
          <div className="hidden sm:block w-36 md:w-48 h-2 bg-white dark:bg-muted rounded-full overflow-hidden border border-[#D1D5DB] dark:border-border">
            <div
              className="h-full bg-[#008CCC] dark:bg-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="w-full flex flex-col">
          {/* List of criterion rows */}
          {rows.map((row) => (
            <TrainingPointsRow
              key={row.item.id}
              item={row.item}
              criteriaCode={row.code}
              recordedPoints={recordedMap.get(row.item.id) || 0}
              recordedTransactions={recordedTxMap.get(row.item.id) || []}
              selfScore={studentScores[row.item.id] || 0}
              selfDescription={studentDescriptions[row.item.id] || selfTxDescriptionMap.get(row.item.id) || ''}
              isLeaf={row.isLeaf}
              onSaveSelfScore={onSaveSelfScore}
            />
          ))}

          {/* Bottom Section Total Row ("Cộng điểm mục I") */}
          <div className="flex items-stretch bg-[#F0F2F5] dark:bg-muted/60 border-t border-[#E5E7EB] dark:border-border font-semibold text-xs h-8">
            {/* Title spans across Tiêu chí (80px) + Tên tiêu chí (flex-1 min-w-[280px]) */}
            <div className="flex-1 min-w-[360px] px-3 flex items-center border-r border-[#E5E7EB] dark:border-border text-foreground font-heading">
              Cộng điểm mục {sectionRoman}
            </div>

            {/* Điểm tối đa (96px) */}
            <div className="w-24 min-w-[96px] max-w-[96px] px-1 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border text-foreground text-center shrink-0">
              {section.maximum}
            </div>

            {/* Dữ liệu ghi nhận (112px) */}
            <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border text-foreground text-center shrink-0">
              {totalRecorded}
            </div>

            {/* SV đánh giá (112px) */}
            <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border text-foreground text-center shrink-0">
              {totalSelf}
            </div>

            {/* Chi tiết tổng hợp/Tổng (144px) */}
            <div className="w-36 min-w-[144px] max-w-[144px] px-1 flex items-center justify-center text-[#1B4B8A] dark:text-primary text-center shrink-0 font-bold">
              {finalSectionScore}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
