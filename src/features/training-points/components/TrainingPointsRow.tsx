import { MobileCriterionCard } from '@/shared/components/MobileCriterionCard'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Pencil, Eye } from 'lucide-react'
import { SelfEvaluationModal } from './SelfEvaluationModal'
import { CriterionDetailModal } from './CriterionDetailModal'
import type {
  PointCategoryNode,
  PointTransaction,
  StudentSemesterPointFlattenedItem,
} from '../types/trainingPoints.types'
import { trainingPointsService } from '../services/trainingPointsService'
import { capTrainingPoints } from '../utils/scoreCalculator'

interface TrainingPointsRowProps {
  item: PointCategoryNode | StudentSemesterPointFlattenedItem
  criteriaCode: string
  recordedPoints: number
  recordedTransactions?: PointTransaction[]
  manualTransaction?: PointTransaction
  selfScore: number
  selfDescription?: string
  isLeaf: boolean
  semesterId?: number
  onSaveSelfScore: (categoryId: number, score: number, description?: string) => Promise<void> | void
  onDeleteSelfScore?: (transactionId: number, categoryId: number) => Promise<void> | void
}

export const TrainingPointsRow: React.FC<TrainingPointsRowProps> = ({
  item,
  criteriaCode,
  recordedPoints,
  recordedTransactions,
  manualTransaction,
  selfScore,
  selfDescription = '',
  isLeaf,
  semesterId,
  onSaveSelfScore,
  onDeleteSelfScore,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const {
    data: lazyTransactions = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['point-transactions', semesterId, item.id],
    queryFn: () => trainingPointsService.getPointTransactionsByCategory(semesterId!, item.id),
    enabled: (isDetailModalOpen || isSelfModalOpen) && isLeaf && Boolean(semesterId),
    staleTime: 0,
  })
  const effectiveRecordedTxs = (
    lazyTransactions.length ? lazyTransactions : recordedTransactions || []
  ).filter((tx) => tx.type !== 'MANUAL')
  const effectiveManualTx = lazyTransactions.find((tx) => tx.type === 'MANUAL') || manualTransaction

  const effectiveDescription = selfDescription || effectiveManualTx?.description || ''

  // Row background and indent styling based on hierarchy level
  const isGroupHeader = !isLeaf && item.level <= 2
  const indentClass = item.level === 3 ? 'pl-5' : item.level === 2 ? 'pl-2.5' : ''

  // Total for this criterion: recorded points + student score, capped at maximum
  const rowTotal = capTrainingPoints(recordedPoints + selfScore, item.maximum)

  return (
    <>
      {isMobile ? (
        <MobileCriterionCard
          code={criteriaCode}
          title={item.name}
          note={item.note || undefined}
          group={!isLeaf}
          result={isLeaf ? `${rowTotal}/${item.maximum}` : undefined}
          recorded={`${recordedPoints} điểm`}
          evaluation={`${selfScore} điểm`}
          evaluated={Boolean(selfScore || effectiveDescription)}
          onEvaluate={() => setIsSelfModalOpen(true)}
          onDetail={() => setIsDetailModalOpen(true)}
        />
      ) : (
        <div
          className={`student-score-row training-points-columns flex items-stretch border-b border-border text-xs min-h-[36px] tabular-nums transition-colors ${
            isGroupHeader
              ? 'bg-muted/40 font-medium text-foreground'
              : 'bg-background hover:bg-muted/20 text-foreground/90'
          }`}
        >
          {/* 1. Tiêu chí (80px) */}
          <div className="w-20 min-w-[80px] max-w-[80px] px-1 py-2 flex items-center justify-center border-r border-border font-medium text-foreground/80 shrink-0 text-center">
            {criteriaCode}
          </div>

          {/* 2. Tên tiêu chí (flex-1 min-w-[280px]) */}
          <div
            className={`flex-1 min-w-[280px] px-3 py-2 flex flex-col justify-center border-r border-border ${indentClass}`}
          >
            <span
              className={`${isGroupHeader ? 'font-semibold text-foreground' : 'text-foreground/90'} leading-relaxed`}
            >
              {item.name}
            </span>
            {item.note && (
              <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {item.note}
              </span>
            )}
          </div>

          {/* 3. Điểm tối đa (96px) */}
          <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center border-r border-border font-medium text-foreground/80 shrink-0 text-center">
            <span className="student-score-label">Điểm tối đa</span>
            {item.maximum > 0 ? item.maximum : ''}
          </div>

          {/* 4. Dữ liệu ghi nhận (112px) */}
          <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-border text-center shrink-0">
            <span className="student-score-label">Điểm hệ thống</span>
            {recordedPoints > 0 ? (
              <span className="font-semibold text-primary">{recordedPoints}</span>
            ) : (
              <span className="text-muted-foreground/60">—</span>
            )}
          </div>

          {/* 5. SV đánh giá (112px) - Click cây bút mở Modal tự chấm điểm */}
          <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-border shrink-0">
            <span className="student-score-label">Tự đánh giá</span>
            {isLeaf ? (
              <Tooltip content="Nhấp để tự chấm điểm và nhập minh chứng">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsSelfModalOpen(true)}
                  className="group relative flex w-full items-center justify-center px-7 py-1 rounded-md border border-transparent hover:border-border hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <span className="relative inline-flex items-center justify-center font-medium text-xs text-foreground group-hover:text-primary min-w-[12px] text-center">
                    {selfScore}
                    <Pencil className="absolute left-full ml-1.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </span>
                </Button>
              </Tooltip>
            ) : null}
          </div>

          {/* 6. Chi tiết tổng hợp/Tổng (144px) - Hiện con mắt nếu có dữ liệu */}
          <div className="relative w-36 min-w-[144px] max-w-[144px] px-10 py-2 flex items-center justify-center shrink-0 text-center">
            <span className="student-score-label">Tổng / Chi tiết</span>
            {isLeaf ? (
              <span className="relative inline-flex min-w-[12px] items-center justify-center">
                <span
                  className={`font-semibold ${rowTotal > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}
                >
                  {rowTotal}
                </span>

                {/* Eye icon shown only if row has selfScore > 0 or recordedPoints > 0 */}
                {isLeaf && (
                  <Tooltip content="Xem chi tiết hoạt động được cộng và nội dung đánh giá">
                    <Button
                      type="button"
                      onClick={() => setIsDetailModalOpen(true)}
                      variant="ghost"
                      size="icon"
                      aria-label="Chi tiết điểm và minh chứng"
                      className="absolute left-full h-8 w-6 p-0 shrink-0 text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                )}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Tự đánh giá */}
      {isSelfModalOpen && (
        <SelfEvaluationModal
          isOpen={isSelfModalOpen}
          onClose={() => setIsSelfModalOpen(false)}
          criterionName={item.name}
          criteriaCode={criteriaCode}
          maxPoints={item.maximum}
          currentScore={selfScore}
          currentDescription={effectiveDescription}
          onSave={(points, desc) => onSaveSelfScore(item.id, points, desc)}
          onDelete={
            effectiveManualTx && onDeleteSelfScore
              ? () => onDeleteSelfScore(effectiveManualTx.id, item.id)
              : undefined
          }
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
          recordedTransactions={effectiveRecordedTxs}
          selfScore={selfScore}
          selfDescription={effectiveDescription}
          totalPoints={rowTotal}
          isLoading={isFetching}
          loadError={isError}
          onRetry={() => void refetch()}
          onOpenSelfEvaluation={() => {
            setIsDetailModalOpen(false)
            setIsSelfModalOpen(true)
          }}
          onDeleteSelfEvaluation={
            effectiveManualTx && onDeleteSelfScore
              ? () => onDeleteSelfScore(effectiveManualTx.id, item.id)
              : undefined
          }
        />
      )}
    </>
  )
}
