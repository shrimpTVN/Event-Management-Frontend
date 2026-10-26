import React from 'react'
import { X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tDetailModalProps {
  isOpen: boolean
  onClose: () => void
  node: CriteriaProgressNode
  criteriaCode: string
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Đã xác nhận'
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

export const Sv5tDetailModal: React.FC<Sv5tDetailModalProps> = ({
  isOpen,
  onClose,
  node,
  criteriaCode,
}) => {
  if (!isOpen) return null

  const isSystemRecorded =
    node.completionSource === 'EVENT_CHECKOUT' || node.completionSource === 'SYSTEM'
  const hasSelfEval = node.isCompleted || Boolean(node.note)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header matching CriterionDetailModal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-base text-foreground font-heading">
              Chi tiết tiêu chuẩn
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {criteriaCode} - {node.name}
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
          {/* Section 1: Dữ liệu hệ thống ghi nhận */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground">
              1. Dữ liệu hệ thống ghi nhận
            </div>

            {isSystemRecorded ? (
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground leading-snug">
                      {node.name}
                    </span>
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      Đã ghi nhận
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(node.completedAt)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã xác nhận tự động
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                Chưa có hoạt động hay dữ liệu ghi nhận tự động nào từ hệ thống.
              </div>
            )}
          </div>

          {/* Section 2: Sinh viên tự đánh giá */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="font-semibold text-foreground">
              2. Sinh viên tự đánh giá
            </div>

            {hasSelfEval ? (
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Trạng thái tự đánh giá:</span>
                  <span
                    className={`font-bold text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                      node.isCompleted
                        ? 'bg-[#F0FDF4] text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {node.isCompleted ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Đạt
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Chưa đạt
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-border/50">
                  <span className="text-muted-foreground text-[11px] block">
                    Nội dung minh chứng / giải trình:
                  </span>
                  <p className="text-xs text-foreground bg-background p-2.5 rounded border border-border leading-relaxed whitespace-pre-wrap">
                    {node.note || 'Sinh viên tự đánh giá đạt theo tiêu chuẩn quy định.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                Sinh viên chưa tự đánh giá cho tiêu chuẩn này.
              </div>
            )}
          </div>

          {/* Section 3: Kết quả tổng hợp tiêu chuẩn */}
          <div className="pt-2 border-t border-border/60">
            <div className="p-3.5 rounded-lg bg-[#EFF5FC] dark:bg-primary/10 border border-[#DBEAFE] dark:border-primary/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground text-xs block">
                  Kết quả tổng hợp tiêu chuẩn
                </span>
                <span className="text-[11px] text-muted-foreground">
                  (Dữ liệu hệ thống + SV tự đánh giá)
                </span>
              </div>
              <div>
                {node.isCompleted ? (
                  <span className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#F0FDF4] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#BBF7D0] dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ĐẠT
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#FFFEEB] text-[#7D7716] dark:bg-amber-950/40 dark:text-amber-400 border border-[#A89F1D]/40 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    CHƯA ĐẠT
                  </span>
                )}
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
