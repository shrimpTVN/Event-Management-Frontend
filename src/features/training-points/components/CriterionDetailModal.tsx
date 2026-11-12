import React, { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { PointTransaction } from '../types/trainingPoints.types'

interface CriterionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  criterionName: string
  criteriaCode: string
  maxPoints: number
  recordedTransactions: PointTransaction[]
  selfScore: number
  selfDescription?: string
  totalPoints: number
  onOpenSelfEvaluation?: () => void
  onDeleteSelfEvaluation?: () => Promise<void> | void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

export const CriterionDetailModal: React.FC<CriterionDetailModalProps> = ({
  isOpen,
  onClose,
  criterionName,
  criteriaCode,
  maxPoints,
  recordedTransactions,
  selfScore,
  selfDescription,
  totalPoints,
  onOpenSelfEvaluation,
  onDeleteSelfEvaluation,
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleDelete = async () => {
    if (!onDeleteSelfEvaluation) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi tự chấm điểm này không?')) return
    try {
      setIsDeleting(true)
      await onDeleteSelfEvaluation()
      onClose()
    } catch (err) {
      console.error('Failed to delete point transaction:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, (totalPoints / (maxPoints || 1)) * 100)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border/60 w-full max-w-[440px] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Subtitle, Title & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 pr-2">
            <p className="text-xs text-muted-foreground font-medium">
              Chi tiết điểm tiêu chí · {criteriaCode}
            </p>
            <h4 className="text-[15px] font-semibold text-foreground leading-snug">
              {criterionName}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer rounded-lg"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Điểm tổng hợp lớn & Progress bar mỏng (Màu hệ thống: text-primary, bg-primary, bg-muted) */}
        <div className="space-y-2.5">
          <div className="flex items-baseline gap-1.5 font-heading">
            <span className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
              {totalPoints}
            </span>
            <span className="text-base text-muted-foreground font-normal">
              / {maxPoints} điểm
            </span>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tổng = điểm hệ thống + sinh viên tự đánh giá, tối đa {maxPoints} điểm.
          </p>
        </div>

        {/* Section 1: Dữ liệu hệ thống ghi nhận */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Hệ thống ghi nhận
          </h4>

          {recordedTransactions.length > 0 ? (
            <div className="space-y-3">
              {recordedTransactions.map((tx) => (
                <div key={tx.id} className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-foreground font-normal leading-snug">
                      {tx.eventName || tx.description || 'Hoạt động được ghi nhận'}
                    </span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      +{tx.points}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(tx.createdAt)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Đã xác nhận
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/80 py-0.5">
              Chưa có hoạt động nào được ghi nhận
            </p>
          )}
        </div>

        {/* Section 2: Sinh viên tự đánh giá */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Sinh viên tự đánh giá
          </h4>

          {selfScore > 0 || selfDescription ? (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[14px] text-foreground font-normal leading-snug">
                  {selfDescription || 'Sinh viên tự chấm điểm'}
                </span>
                <span className="text-sm font-semibold text-primary shrink-0">
                  +{selfScore}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                {onOpenSelfEvaluation && (
                  <button
                    type="button"
                    onClick={onOpenSelfEvaluation}
                    disabled={isDeleting}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Chỉnh sửa tự chấm
                  </button>
                )}
                {onDeleteSelfEvaluation && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa tự chấm'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm text-muted-foreground">
                Chưa chấm điểm
              </span>
              {onOpenSelfEvaluation && (
                <button
                  type="button"
                  onClick={onOpenSelfEvaluation}
                  className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                >
                  Tự chấm điểm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default CriterionDetailModal
