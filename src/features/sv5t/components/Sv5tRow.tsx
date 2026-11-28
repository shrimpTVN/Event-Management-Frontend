import { MobileCriterionCard } from '@/shared/components/MobileCriterionCard'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { Sv5tSelfEvaluationModal } from './Sv5tSelfEvaluationModal'
import { Sv5tDetailModal } from './Sv5tDetailModal'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tRowProps {
  node: CriteriaProgressNode
  criteriaCode: string
  isLeaf: boolean
  isGroupBanner?: boolean
  academicYearId?: number
  onSaveProgress: (
    criteriaId: number,
    completed: boolean,
    note: string,
    transactionId?: number
  ) => Promise<void> | void
  onDeleteProgress?: (criteriaTransactionId: number, criteriaId: number) => Promise<void> | void
}

export const Sv5tRow: React.FC<Sv5tRowProps> = ({
  node,
  criteriaCode,
  isLeaf,
  isGroupBanner = false,
  academicYearId,
  onSaveProgress,
  onDeleteProgress,
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selfModalInitialNote, setSelfModalInitialNote] = useState<string | null>(null)
  const [selfModalInitialCompleted, setSelfModalInitialCompleted] = useState<boolean | null>(null)
  const [selfModalTransactionId, setSelfModalTransactionId] = useState<number | null>(null)

  const isSelfEvaluated = Boolean(node.isSelfEvaluated)

  // 1. Group banner row (e.g. 1.3: Đạt thêm 01 trong 05 tiêu chí sau:)
  if (isGroupBanner) {
    if (isMobile) return <MobileCriterionCard code={criteriaCode} title={node.name} group />
    return (
      <div className="student-score-group flex items-stretch bg-muted/40 border-b border-border text-xs min-h-[38px] select-none">
        {/* Mã TC (86px) */}
        <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2 flex items-center justify-center border-r border-border font-semibold text-primary shrink-0 text-center">
          {criteriaCode}
        </div>
        {/* Nội dung gộp (căn giữa theo yêu cầu của giao diện) */}
        <div className="flex-1 px-3 py-2 flex items-center justify-center text-center font-medium text-foreground">
          {node.name}
        </div>
      </div>
    )
  }

  const isEventRecorded = node.isCompleted

  return (
    <>
      {isMobile ? (
        <MobileCriterionCard
          code={criteriaCode}
          title={node.name}
          note={node.note || undefined}
          group={!isLeaf}
          recorded={
            (node.requiredOccurrences || 1) > 1
              ? `${node.recordedOccurrences || 0}/${node.requiredOccurrences} lần`
              : isEventRecorded
                ? 'Đạt'
                : 'Chưa ghi nhận'
          }
          evaluation={isSelfEvaluated ? (node.isCompleted ? 'Đạt' : 'Chưa đạt') : 'Chưa đánh giá'}
          evaluated={isSelfEvaluated && node.isCompleted}
          onEvaluate={() => {
            setSelfModalInitialNote(isSelfEvaluated ? node.selfEvaluationNote || '' : '')
            setSelfModalInitialCompleted(isSelfEvaluated)
            setSelfModalTransactionId(node.manualTransactionId ?? null)
            setIsSelfModalOpen(true)
          }}
          onDetail={() => setIsDetailModalOpen(true)}
        />
      ) : (
        <div className="student-score-row flex items-stretch border-b border-border text-xs min-h-[40px] bg-background hover:bg-muted/20 transition-colors">
          {/* 1. Mã TC (86px) */}
          <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2.5 flex items-center justify-center border-r border-border font-medium text-foreground/80 shrink-0 text-center">
            {criteriaCode}
          </div>

          {/* 2. Tên tiêu chuẩn (flex-1) */}
          <div className="flex-1 min-w-[280px] px-3 py-2.5 flex flex-col justify-center border-r border-border">
            <span className="text-foreground/90 leading-relaxed font-normal">{node.name}</span>
            {node.note && (
              <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {node.note}
              </span>
            )}
          </div>

          {/* 3. Dữ liệu ghi nhận (136px) */}
          <div className="w-[136px] min-w-[136px] max-w-[136px] px-2 py-2.5 flex items-center justify-center border-r border-border shrink-0 text-center">
            <span className="student-score-label">Ghi nhận</span>
            {(node.requiredOccurrences || 1) > 1 ? (
              <span
                className={`text-xs font-medium ${node.isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`}
              >
                {node.recordedOccurrences || 0}/{node.requiredOccurrences} lần
                {node.isCompleted ? ' · Đạt' : ''}
              </span>
            ) : isEventRecorded ? (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 block">
                Đạt
              </span>
            ) : (
              <span className="text-muted-foreground/50 font-medium">—</span>
            )}
          </div>

          {/* 4. SV đánh giá (136px) */}
          <div className="w-[136px] min-w-[136px] max-w-[136px] px-2 py-2.5 flex items-center justify-center border-r border-border shrink-0 text-center">
            <span className="student-score-label">Tự đánh giá</span>
            {isLeaf ? (
              <Tooltip content="Nhấp để tự đánh giá tiêu chuẩn và bổ sung minh chứng">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setSelfModalInitialNote(isSelfEvaluated ? node.selfEvaluationNote || '' : '')
                    setSelfModalInitialCompleted(isSelfEvaluated)
                    setSelfModalTransactionId(node.manualTransactionId ?? null)
                    setIsSelfModalOpen(true)
                  }}
                  className="h-8 px-0 hover:bg-transparent"
                >
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold block ${
                      isSelfEvaluated && node.isCompleted
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isSelfEvaluated ? (node.isCompleted ? 'Đạt' : 'Chưa đạt') : 'Chưa đánh giá'}
                  </span>
                </Button>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground/50 font-medium">—</span>
            )}
          </div>

          {/* 5. Chi tiết (184px) */}
          <div className="w-[184px] min-w-[184px] max-w-[184px] px-2 py-2.5 flex items-center justify-center shrink-0 text-center">
            <span className="student-score-label">Chi tiết</span>
            <Tooltip content="Chi tiết tiêu chí">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Chi tiết</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Modal tự đánh giá */}
      {isSelfModalOpen && (
        <Sv5tSelfEvaluationModal
          isOpen={isSelfModalOpen}
          onClose={() => setIsSelfModalOpen(false)}
          criterionName={node.name}
          criteriaCode={criteriaCode}
          isCompleted={
            selfModalInitialCompleted !== null ? selfModalInitialCompleted : isSelfEvaluated
          }
          currentNote={
            selfModalInitialNote !== null
              ? selfModalInitialNote
              : isSelfEvaluated
                ? node.selfEvaluationNote || ''
                : ''
          }
          onSave={async (completed, note) => {
            const finalNote = completed ? note : ''
            await onSaveProgress(
              node.criteriaId,
              completed,
              finalNote,
              selfModalTransactionId ?? undefined
            )
            setIsSelfModalOpen(false)
          }}
          onDelete={
            selfModalTransactionId && onDeleteProgress
              ? async () => {
                  await onDeleteProgress(selfModalTransactionId, node.criteriaId)
                  setIsSelfModalOpen(false)
                }
              : undefined
          }
        />
      )}

      {/* Modal chi tiết */}
      {isDetailModalOpen && (
        <Sv5tDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          node={node}
          criteriaCode={criteriaCode}
          academicYearId={academicYearId}
          onOpenSelfEvaluation={
            isLeaf
              ? (currentNote?: string, isCompleted?: boolean, transactionId?: number) => {
                  const resolvedCompleted = isCompleted ?? isSelfEvaluated
                  setSelfModalInitialNote(
                    resolvedCompleted ? (currentNote ?? node.selfEvaluationNote ?? '') : ''
                  )
                  setSelfModalInitialCompleted(resolvedCompleted)
                  setSelfModalTransactionId(transactionId ?? null)
                  setIsDetailModalOpen(false)
                  setIsSelfModalOpen(true)
                }
              : undefined
          }
          onDeleteManualTransaction={onDeleteProgress}
        />
      )}
    </>
  )
}
