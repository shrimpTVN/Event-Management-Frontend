import React from 'react'
import { X, CheckCircle2, Calendar } from 'lucide-react'
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
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-base text-foreground font-heading">
              Chi tiết điểm tiêu chí
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {criteriaCode} - {criterionName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm custom-scrollbar">
          {/* Section 1: Dữ liệu ghi nhận từ hệ thống */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground">
              1. Dữ liệu hệ thống ghi nhận
            </div>

            {recordedTransactions.length > 0 ? (
              <div className="space-y-2">
                {recordedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground leading-snug">
                        {tx.eventName || tx.description || 'Hoạt động được ghi nhận'}
                      </span>
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{tx.points} điểm
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tx.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã xác nhận
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                Chưa có hoạt động hay điểm ghi nhận tự động nào từ hệ thống.
              </div>
            )}
          </div>

          {/* Section 2: Sinh viên tự đánh giá */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="font-semibold text-foreground">
              2. Sinh viên tự đánh giá
            </div>

            {selfScore > 0 || selfDescription ? (
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Điểm tự chấm:</span>
                  <span className="font-bold text-sm text-[#1B4B8A] dark:text-primary">
                    {selfScore} điểm
                  </span>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-border/50">
                  <span className="text-muted-foreground text-[11px] block">
                    Nội dung minh chứng / giải trình:
                  </span>
                  <p className="text-xs text-foreground bg-background p-2.5 rounded border border-border leading-relaxed whitespace-pre-wrap">
                    {selfDescription || 'Sinh viên tự chấm điểm theo đúng quy định rèn luyện.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                Sinh viên chưa tự chấm điểm cho tiêu chí này.
              </div>
            )}
          </div>

          {/* Section 3: Tổng điểm tiêu chí */}
          <div className="pt-2 border-t border-border/60">
            <div className="p-3.5 rounded-lg bg-[#EFF5FC] dark:bg-primary/10 border border-[#DBEAFE] dark:border-primary/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground text-xs block">
                  Tổng điểm tổng hợp tiêu chí
                </span>
                <span className="text-[11px] text-muted-foreground">
                  (Điểm hệ thống + SV tự đánh giá, tối đa {maxPoints}đ)
                </span>
              </div>
              <div className="flex items-baseline gap-1 font-heading">
                <span className="text-xl font-bold text-[#008CCC] dark:text-cyan-400">
                  {totalPoints}
                </span>
                <span className="text-xs text-muted-foreground">/ {maxPoints}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
