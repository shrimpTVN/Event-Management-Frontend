import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
    if ('items' in section && Array.isArray((section as any).items) && (section as any).items.length > 0) {
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
        let code = ''
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
      (section as any).children.forEach((child: any, idx: number) => {
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
              {totalRecorded > 0 ? totalRecorded : (finalSectionScore > 0 && totalSelf === 0 ? finalSectionScore : 0)}
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
