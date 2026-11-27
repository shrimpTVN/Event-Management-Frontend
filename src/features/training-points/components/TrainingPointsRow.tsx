import { MobileCriterionCard } from '@/shared/components/MobileCriterionCard'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { getMeaningfulCriterionNote } from '@/shared/utils/criterionNote'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Pencil, Eye, Info } from 'lucide-react'
import { SelfEvaluationModal } from './SelfEvaluationModal'
import { CriterionDetailModal } from './CriterionDetailModal'
import type {
  PointCategoryNode,
  PointTransaction,
  StudentSemesterPointFlattenedItem,
} from '../types/trainingPoints.types'
import { trainingPointsService } from '../services/trainingPointsService'
import { useAuthStore } from '@/features/auth'

interface TrainingPointsRowProps {
  item: PointCategoryNode | StudentSemesterPointFlattenedItem
  criteriaCode: string
  recordedPoints: number
  recordedTransactions?: PointTransaction[]
  manualTransaction?: PointTransaction
  selfScore: number
  aggregatedTotal?: number
  supersededByMax?: boolean
  selfDescription?: string
  isLeaf: boolean
  semesterId?: number
  onSaveSelfScore: (
    categoryId: number,
    score: number,
    description?: string,
    transactionId?: number
  ) => Promise<void> | void
  onDeleteSelfScore?: (transactionId: number, categoryId: number) => Promise<void> | void
}

export const TrainingPointsRow: React.FC<TrainingPointsRowProps> = ({
  item,
  criteriaCode,
  recordedPoints,
  recordedTransactions,
  selfScore,
  supersededByMax = false,
  selfDescription = '',
  isLeaf,
  semesterId,
  onSaveSelfScore,
  onDeleteSelfScore,
}) => {
  const userKey = useAuthStore((state) => state.user?.id ?? state.user?.email ?? 'current')
  const [editingTransaction, setEditingTransaction] = useState<PointTransaction | null>(null)
  const openNewEvaluation = () => {
    setEditingTransaction(null)
    setIsSelfModalOpen(true)
  }
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const {
    data: lazyTransactions = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['point-transactions', userKey, semesterId, item.id],
    queryFn: () => trainingPointsService.getPointTransactionsByCategory(semesterId!, item.id),
    enabled: (isDetailModalOpen || isSelfModalOpen) && isLeaf && Boolean(semesterId),
    staleTime: 0,
  })
  const effectiveRecordedTxs = (
    lazyTransactions.length ? lazyTransactions : recordedTransactions || []
  ).filter((tx) => tx.type !== 'MANUAL')
  const manualTransactions = lazyTransactions.filter((transaction) => transaction.type === 'MANUAL')
  const effectiveDescription = selfDescription || ''

  // Row background and indent styling based on hierarchy level
  const isSectionSubGroup = !isLeaf && item.level <= 1
  const isNestedGroup = !isLeaf && item.level > 1
  const indentClass = item.level >= 3 ? 'pl-6' : item.level === 2 ? 'pl-3.5' : ''
  const meaningfulNote = getMeaningfulCriterionNote(item.name, item.note)

  const serverNode = item as StudentSemesterPointFlattenedItem
  const rowTotal = Math.min(item.maximum, serverNode.totalPoint ?? 0)
  const isMaxReached = serverNode.isAtMaximum ?? false
  const isMaxChildGroup = !isLeaf && Boolean(item.isMaxChild)
  const maxChildExplanation = isMaxChildGroup
    ? 'Mục này lấy điểm cao nhất trong các tiêu chí con (không cộng dồn)'
    : undefined

  return (
    <>
      {isMobile ? (
        <MobileCriterionCard
          code={criteriaCode}
          title={item.name}
          note={item.note || undefined}
          maxChildExplanation={maxChildExplanation}
          group={!isLeaf}
          result={isLeaf || rowTotal > 0 ? `${rowTotal}/${item.maximum}` : undefined}
          recorded={`${recordedPoints} điểm`}
          evaluation={`${selfScore} điểm`}
          evaluated={Boolean(selfScore || effectiveDescription)}
          onEvaluate={openNewEvaluation}
          onDetail={() => setIsDetailModalOpen(true)}
        />
      ) : (
        <div
          className={`group/row student-score-row training-points-columns flex items-stretch border-b border-border/70 text-xs min-h-[38px] tabular-nums transition-colors ${
            isSectionSubGroup
              ? 'bg-muted/55 font-semibold text-foreground'
              : isNestedGroup
                ? 'bg-muted/25 font-medium text-foreground'
                : 'bg-background hover:bg-muted/20 text-foreground/90'
          } ${supersededByMax ? 'opacity-70' : ''}`}
        >
          {/* 1. Tiêu chí (80px) */}
          <div className="w-20 min-w-[80px] max-w-[80px] px-1 py-2 flex items-center justify-center border-r border-border/70 font-medium text-muted-foreground shrink-0 text-center">
            {criteriaCode}
          </div>

          {/* 2. Tên tiêu chí (flex-1 min-w-[280px]) */}
          <div className="flex-1 min-w-[280px] px-3 py-2 flex flex-col justify-center border-r border-border/70">
            <div className={indentClass}>
              <div className="leading-relaxed">
                <span
                  className={`${isSectionSubGroup || isNestedGroup ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
                >
                  {item.name}
                </span>
                {maxChildExplanation && (
                  <Tooltip content={maxChildExplanation}>
                    <span
                      aria-label="Giải thích cách tính điểm mục con"
                      className="ml-1.5 inline-flex h-5 w-5 align-middle items-center justify-center rounded-full text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Tooltip>
                )}
              </div>
              {meaningfulNote && (
                <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {meaningfulNote}
                </span>
              )}
            </div>
          </div>

          {/* 3. Điểm tối đa (96px) */}
          <div className="w-24 min-w-[96px] max-w-[96px] px-1 py-2 flex items-center justify-center border-r border-border/70 font-medium text-muted-foreground shrink-0 text-center">
            <span className="student-score-label">Điểm tối đa</span>
            {item.maximum > 0 ? item.maximum : ''}
          </div>

          {/* 4. Dữ liệu ghi nhận (112px) */}
          <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-border/70 text-center shrink-0">
            <span className="student-score-label">Điểm hệ thống</span>
            {recordedPoints > 0 ? (
              <span className="font-semibold text-primary">{recordedPoints}</span>
            ) : (
              <span className="text-muted-foreground/45">—</span>
            )}
          </div>

          {/* 5. SV đánh giá (112px) - Click cây bút mở Modal tự chấm điểm; hàng cha hiển thị điểm gộp read-only */}
          <div className="w-28 min-w-[112px] max-w-[112px] px-1 py-2 flex items-center justify-center border-r border-border/70 shrink-0">
            <span className="student-score-label">Tự đánh giá</span>
            {isLeaf ? (
              <Tooltip content="Nhấp để tự chấm điểm và nhập minh chứng">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={openNewEvaluation}
                  className="group relative flex w-full items-center justify-center px-7 py-1 rounded-md border border-transparent hover:border-border hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <span
                    className={`relative inline-flex items-center justify-center font-medium text-xs group-hover:text-primary min-w-[12px] text-center ${
                      selfScore > 0 ? 'text-foreground' : 'text-muted-foreground/45'
                    }`}
                  >
                    {selfScore}
                    <Pencil
                      className={`absolute left-full ml-1.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-opacity ${
                        selfScore > 0
                          ? 'opacity-75 group-hover/row:opacity-100'
                          : 'opacity-40 group-hover/row:opacity-100'
                      }`}
                    />
                  </span>
                </Button>
              </Tooltip>
            ) : selfScore > 0 ? (
              <span className="font-medium text-xs text-foreground">{selfScore}</span>
            ) : (
              <span className="text-muted-foreground/45">—</span>
            )}
          </div>

          {/* 6. Chi tiết tổng hợp/Tổng (144px) - Hàng lá hiện con mắt; hàng cha hiển thị tổng gộp */}
          <div className="relative w-36 min-w-[144px] max-w-[144px] px-10 py-2 flex items-center justify-center shrink-0 text-center">
            <span className="student-score-label">Tổng / Chi tiết</span>
            {isLeaf ? (
              <span className="relative inline-flex min-w-[12px] items-center justify-center">
                <span
                  title={
                    supersededByMax
                      ? 'Không cộng dồn vì mục cha đang lấy mức điểm cao nhất'
                      : undefined
                  }
                  className={`font-semibold ${
                    supersededByMax
                      ? 'text-muted-foreground line-through decoration-muted-foreground/60'
                      : isMaxReached
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : rowTotal > 0
                          ? 'text-primary'
                          : 'text-muted-foreground/45'
                  }`}
                >
                  {rowTotal}
                </span>

                {/* Eye icon shown quietly until row hover when zero */}
                <Tooltip content="Xem chi tiết hoạt động được cộng và nội dung đánh giá">
                  <Button
                    type="button"
                    onClick={() => setIsDetailModalOpen(true)}
                    variant="ghost"
                    size="icon"
                    aria-label="Chi tiết điểm và minh chứng"
                    className={`absolute left-full h-8 w-6 p-0 shrink-0 text-primary hover:bg-primary/10 transition-opacity ${
                      rowTotal > 0
                        ? 'opacity-85 group-hover/row:opacity-100'
                        : 'opacity-35 group-hover/row:opacity-100'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </span>
            ) : rowTotal > 0 ? (
              <span
                className={`font-semibold ${
                  isMaxReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                }`}
              >
                {rowTotal}
              </span>
            ) : (
              <span className="text-muted-foreground/45">—</span>
            )}
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
          currentScore={editingTransaction?.points ?? 0}
          currentDescription={editingTransaction?.description ?? ''}
          onSave={(points, desc) => onSaveSelfScore(item.id, points, desc, editingTransaction?.id)}
          onDelete={
            editingTransaction && onDeleteSelfScore
              ? () => onDeleteSelfScore(editingTransaction.id, item.id)
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
          isAtMaximum={serverNode.isAtMaximum}
          completionPercentage={serverNode.completionPercentage}
          manualTransactions={manualTransactions}
          onOpenSelfEvaluation={() => {
            setIsDetailModalOpen(false)
            openNewEvaluation()
          }}
          onEditManualTransaction={(transaction) => {
            setEditingTransaction(transaction)
            setIsDetailModalOpen(false)
            setIsSelfModalOpen(true)
          }}
          onDeleteManualTransaction={
            onDeleteSelfScore
              ? async (transaction) => {
                  await onDeleteSelfScore(transaction.id, item.id)
                  await refetch()
                }
              : undefined
          }
        />
      )}
    </>
  )
}
