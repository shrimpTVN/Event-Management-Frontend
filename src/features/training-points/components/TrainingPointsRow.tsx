import React, { useState } from 'react'
import { Pencil, Eye } from 'lucide-react'
import { SelfEvaluationModal } from './SelfEvaluationModal'
import { CriterionDetailModal } from './CriterionDetailModal'
import type { PointCategoryNode, PointTransaction } from '../types/trainingPoints.types'

interface TrainingPointsRowProps {
  item: PointCategoryNode
  criteriaCode: string
  recordedPoints: number
  recordedTransactions: PointTransaction[]
  selfScore: number
  selfDescription?: string
  isLeaf: boolean
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
}

export const TrainingPointsRow: React.FC<TrainingPointsRowProps> = ({
  item,
  criteriaCode,
  recordedPoints,
  recordedTransactions,
  selfScore,
  selfDescription = '',
  isLeaf,
  onSaveSelfScore,
}) => {
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Row background and indent styling based on hierarchy level
  const isGroupHeader = !isLeaf && item.level <= 2
  const indentClass = item.level === 3 ? 'pl-5' : item.level === 2 ? 'pl-2.5' : ''

  // Total for this criterion: recorded points + student score, capped at maximum
  const rowTotal = Math.min(item.maximum, recordedPoints + selfScore)
  const hasDetails = isLeaf && (recordedPoints > 0 || selfScore > 0)

  return (
    <>
      <div
        className={`flex items-stretch border-b border-[#E5E7EB] dark:border-border text-xs min-h-[36px] transition-colors ${
          isGroupHeader
            ? 'bg-[#F9FAFB] dark:bg-muted/40 font-medium text-foreground'
            : 'bg-white dark:bg-card hover:bg-muted/20 text-foreground/90'
        }`}
      >
        {/* 1. Tiêu chí (80px) */}
        <div className="w-20 min-w-[80px] max-w-[80px] px-1 py-2 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border font-medium text-foreground/80 shrink-0 text-center">
          {criteriaCode}
        </div>

        {/* 2. Tên tiêu chí (flex-1 min-w-[280px]) */}
        <div className={`flex-1 min-w-[280px] px-3 py-2 flex flex-col justify-center border-r border-[#E5E7EB] dark:border-border ${indentClass}`}>
          <span className={`${isGroupHeader ? 'font-semibold text-foreground' : 'text-foreground/90'} leading-relaxed`}>
            {item.name}
          </span>
          {item.note && (
            <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {item.note}
            </span>
          )}
        </div>

        {/* 3. Điểm tối đa (96px) */}
        <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border font-medium text-foreground/80 shrink-0 text-center">
          {item.maximum > 0 ? item.maximum : ''}
        </div>

        {/* 4. Dữ liệu ghi nhận (112px) */}
        <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border text-center shrink-0">
          {recordedPoints > 0 ? (
            <span className="font-semibold text-[#1B4B8A] dark:text-primary">
              {recordedPoints}
            </span>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </div>

        {/* 5. SV đánh giá (112px) - Click cây bút mở Modal tự chấm điểm */}
        <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border shrink-0">
          {isLeaf ? (
            <button
              type="button"
              onClick={() => setIsSelfModalOpen(true)}
              title="Nhấp để tự chấm điểm và nhập minh chứng"
              className="group flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md border border-transparent hover:border-[#A6ADB8] hover:bg-muted/60 transition-all cursor-pointer"
            >
              <span className="font-medium text-xs text-foreground group-hover:text-primary min-w-[12px] text-center">
                {selfScore}
              </span>
              <Pencil className="h-3.5 w-3.5 text-[#A6ADB8] group-hover:text-primary transition-colors shrink-0" />
            </button>
          ) : null}
        </div>

        {/* 6. Chi tiết tổng hợp/Tổng (144px) - Hiện con mắt nếu có dữ liệu */}
        <div className="w-36 min-w-[144px] max-w-[144px] px-2 py-2 flex items-center justify-center shrink-0 text-center gap-2">
          {isLeaf ? (
            <>
              <span className={`font-semibold ${rowTotal > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {rowTotal}
              </span>

              {/* Eye icon shown only if row has selfScore > 0 or recordedPoints > 0 */}
              {hasDetails && (
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  title="Xem chi tiết hoạt động được cộng và nội dung đánh giá"
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Modal Tự đánh giá */}
      {isSelfModalOpen && (
        <SelfEvaluationModal
          isOpen={isSelfModalOpen}
          onClose={() => setIsSelfModalOpen(false)}
          criterionName={item.name}
          criteriaCode={criteriaCode}
          maxPoints={item.maximum}
          currentScore={selfScore}
          currentDescription={selfDescription}
          onSave={(points, desc) => onSaveSelfScore(item.id, points, desc)}
        />
      )}

      {/* Modal Chi tiết điểm và minh chứng (Eye icon) */}
      {isDetailModalOpen && (
        <CriterionDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          criterionName={item.name}
          criteriaCode={criteriaCode}
          maxPoints={item.maximum}
          recordedTransactions={recordedTransactions}
          selfScore={selfScore}
          selfDescription={selfDescription}
          totalPoints={rowTotal}
        />
      )}
    </>
  )
}
