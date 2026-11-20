import { Button } from '@/components/ui/button'
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
import { computeCategoryScore } from '../utils/scoreCalculator'

interface TrainingPointsSectionAccordionProps {
  section: PointCategoryNode | StudentSemesterPointGroupedTree | PointCategoryGroupedTree
  sectionRoman: string // 'I', 'II', 'III', 'IV', 'V'
  transactions?: PointTransaction[]
  studentScores: Record<number, number>
  studentDescriptions?: Record<number, string>
  semesterId?: number
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
  onDeleteSelfScore?: (transactionId: number, categoryId: number) => Promise<void> | void
  defaultExpanded?: boolean
  onToggleExpand?: (isExpanded: boolean) => void
  aggregateScore?: number
}

export const TrainingPointsSectionAccordion: React.FC<TrainingPointsSectionAccordionProps> = ({
  section,
  sectionRoman,
  transactions = [],
  studentScores,
  studentDescriptions = {},
  semesterId,
  onSaveSelfScore,
  onDeleteSelfScore,
  defaultExpanded = false,
  onToggleExpand,
  aggregateScore,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const contentId = React.useId()

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

  // Map of categoryId -> manual transaction
  const manualTxMap = React.useMemo(() => {
    const map = new Map<number, PointTransaction>()
    transactions.forEach((tx) => {
      if (tx.type === 'MANUAL') {
        map.set(tx.pointCategoryId, tx)
      }
    })
    return map
  }, [transactions])

  // Flatten rows to render in sequence with generated codes like I.a, I.a.1, I.a.2.1
  const rows = React.useMemo(() => {
    // 1. ƯU TIÊN: Dùng mảng items đã được Backend phân cấp và trải phẳng DFS sẵn
    if (
      'items' in section &&
      Array.isArray((section as any).items) &&
      (section as any).items.length > 0
    ) {
      const items: StudentSemesterPointFlattenedItem[] = (section as any).items
      const list: Array<{
        item: StudentSemesterPointFlattenedItem
        code: string
        isLeaf: boolean
      }> = []

      const codeMap = new Map<number, string>()
      const childCountMap = new Map<number, number>()
      let level1Index = 0

      items.forEach((item) => {
        let code: string
        if (item.level === 1 || !item.parentCategoryId || item.parentCategoryId === section.id) {
          code = `${sectionRoman}.${String.fromCharCode(97 + level1Index)}`
          level1Index++
        } else {
          const parentCode = codeMap.get(item.parentCategoryId) || sectionRoman
          const siblingCount = (childCountMap.get(item.parentCategoryId) || 0) + 1
          childCountMap.set(item.parentCategoryId, siblingCount)
          code = `${parentCode}.${siblingCount}`
        }
        codeMap.set(item.id, code)

        list.push({
          item,
          code,
          isLeaf: item.isLeaf,
        })
      })

      return list
    }

    // 2. FALLBACK: Cấu trúc cây đệ quy truyền thống qua children
    const list: Array<{
      item: any
      code: string
      isLeaf: boolean
    }> = []

    function traverse(node: any, parentCode: string, depth: number) {
      if (!node.children || node.children.length === 0) {
        list.push({ item: node, code: parentCode, isLeaf: true })
        return
      }

      // Group header
      list.push({ item: node, code: parentCode, isLeaf: false })

      node.children.forEach((child: any, idx: number) => {
        const childCode =
          depth === 1
            ? `${parentCode}.${String.fromCharCode(97 + idx)}`
            : `${parentCode}.${idx + 1}`
        traverse(child, childCode, depth + 1)
      })
    }

    if ((section as any).children) {
      ;(section as any).children.forEach((child: any, idx: number) => {
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
        const itemRec =
          (r.item as any).systemPointRecord !== undefined
            ? (r.item as any).systemPointRecord
            : recordedMap.get(r.item.id) || 0
        const itemSelf =
          studentScores[r.item.id] !== undefined
            ? studentScores[r.item.id]
            : (r.item as any).manualPointRecord || 0

        rec += itemRec
        self += itemSelf
      }
    })

    return { totalRecorded: rec, totalSelf: self }
  }, [rows, recordedMap, studentScores])

  // Final section score computed by BE or recursively capping at section maximum
  const finalSectionScore = React.useMemo(() => {
    // Nếu BE đã tính sẵn totalPoint và sinh viên chưa sửa đổi cục bộ
    const beTotal = (section as any).totalPoint
    if (
      beTotal !== undefined &&
      beTotal !== null &&
      totalSelf === ((section as any).manualPointRecord || 0)
    ) {
      return beTotal
    }

    // Nếu có children (cấu trúc cây cũ)
    if ((section as any).children && (section as any).children.length > 0) {
      const computed = computeCategoryScore(section as any, recordedMap, studentScores)
      if (computed > 0) return computed
    }

    // Nếu dùng items từ BE có chỉnh sửa điểm tự chấm ở client
    if ('items' in section && Array.isArray((section as any).items)) {
      return Math.min(section.maximum, totalRecorded + totalSelf)
    }

    return aggregateScore ?? (section as any).totalPoint ?? 0
  }, [section, totalRecorded, totalSelf, aggregateScore, recordedMap, studentScores])

  const progressPercent =
    section.maximum > 0
      ? Math.max(0, Math.min(100, (finalSectionScore / section.maximum) * 100))
      : 0
  const isMaximumReached = section.maximum > 0 && finalSectionScore >= section.maximum

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
        className="achievement-accordion__trigger relative h-auto min-h-[64px] rounded-none w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 whitespace-normal cursor-pointer text-left select-none focus-visible:ring-inset"
      >
        <span className="achievement-accordion__heading relative z-10 flex flex-col gap-1 min-w-0 text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold">{section.name}</span>
          <span className="achievement-accordion__description text-xs font-normal tabular-nums">
            {finalSectionScore}/{section.maximum} điểm
          </span>
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-3">
          {isMaximumReached && (
            <span
              role="img"
              aria-label="Đạt điểm tối đa"
              title="Đạt điểm tối đa"
              className="achievement-accordion__completed flex h-8 w-6 items-center justify-center"
            >
              <BadgeCheck
                aria-hidden="true"
                className="h-6 w-6 fill-current stroke-white"
                strokeWidth={2}
              />
            </span>
          )}
          <ChevronRight aria-hidden="true" className="achievement-accordion__chevron h-4 w-4" />
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
                recordedPoints={
                  (row.item as any).systemPointRecord !== undefined
                    ? (row.item as any).systemPointRecord
                    : recordedMap.get(row.item.id) || 0
                }
                recordedTransactions={recordedTxMap.get(row.item.id) || []}
                manualTransaction={manualTxMap.get(row.item.id)}
                selfScore={
                  studentScores[row.item.id] !== undefined
                    ? studentScores[row.item.id]
                    : (row.item as any).manualPointRecord || 0
                }
                selfDescription={
                  studentDescriptions[row.item.id] || selfTxDescriptionMap.get(row.item.id) || ''
                }
                isLeaf={row.isLeaf}
                semesterId={semesterId}
                onSaveSelfScore={onSaveSelfScore}
                onDeleteSelfScore={onDeleteSelfScore}
              />
            ))}

            {/* Bottom Section Total Row ("Cộng điểm mục I") */}
            <div className="flex items-stretch bg-muted/40 border-t border-border font-semibold text-xs h-8">
              {/* Title spans across Tiêu chí (80px) + Tên tiêu chí (flex-1 min-w-[280px]) */}
              <div className="flex-1 min-w-[360px] px-3 flex items-center border-r border-border text-foreground font-k2d">
                Cộng điểm mục {sectionRoman}
              </div>

              {/* Điểm tối đa (96px) */}
              <div className="w-24 min-w-[96px] max-w-[96px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                {section.maximum}
              </div>

              {/* Dữ liệu ghi nhận (112px) */}
              <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                {totalRecorded > 0
                  ? totalRecorded
                  : finalSectionScore > 0 && totalSelf === 0
                    ? finalSectionScore
                    : 0}
              </div>

              {/* SV đánh giá (112px) */}
              <div className="w-28 min-w-[112px] max-w-[112px] px-1 flex items-center justify-center border-r border-border text-foreground text-center shrink-0">
                {totalSelf}
              </div>

              {/* Chi tiết tổng hợp/Tổng (144px) */}
              <div className="w-36 min-w-[144px] max-w-[144px] px-1 flex items-center justify-center text-primary text-center shrink-0 font-bold">
                {finalSectionScore}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
