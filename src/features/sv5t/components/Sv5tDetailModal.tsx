import React, { useEffect, useState } from 'react'
import { X, CheckCircle2, Clock } from 'lucide-react'
import type { CriteriaProgressNode } from '../types/sv5t.types'
import { sv5tService } from '../services/sv5tService'
import { SV5T_CRITERIA_GUIDES } from '../utils/sv5tTreeBuilder'

interface Sv5tDetailModalProps {
  isOpen: boolean
  onClose: () => void
  node: CriteriaProgressNode
  criteriaCode: string
  academicYearId?: number
  onOpenSelfEvaluation?: (currentNote?: string, isCompleted?: boolean) => void
}

function formatDate(dateStr?: string | null): string {
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

function isGenericText(str?: string | null): boolean {
  if (!str) return true
  const s = str.trim().toLowerCase()
  return (
    s === 'sinh viên tự đánh giá tiêu chuẩn' ||
    s === 'sinh viên tự đánh giá đạt tiêu chuẩn' ||
    s === 'sinh viên tự đánh giá đạt' ||
    s === 'sinh viên tự đánh giá' ||
    s === 'tự đánh giá'
  )
}

export const Sv5tDetailModal: React.FC<Sv5tDetailModalProps> = ({
  isOpen,
  onClose,
  node,
  criteriaCode,
  academicYearId,
  onOpenSelfEvaluation,
}) => {
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true
    if (isOpen && node.criteriaId) {
      const yearId = academicYearId && academicYearId > 0 ? academicYearId : 2
      sv5tService.getCriteriaTransactions(node.criteriaId, yearId).then((txList) => {
        if (isMounted && Array.isArray(txList)) {
          setTransactions(txList)
        }
      })
    } else {
      setTransactions([])
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, node.criteriaId, academicYearId])

  if (!isOpen) return null

  // Sort transactions by createdAt DESC and id DESC (latest first)
  const sortedTxs = [...transactions].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime() || a.id || 0
    const timeB = new Date(b.createdAt || 0).getTime() || b.id || 0
    return timeB - timeA
  })

  // Check event/system records
  const isSystemRecorded =
    node.completionSource === 'EVENT_CHECKOUT' ||
    node.completionSource === 'SYSTEM' ||
    sortedTxs.some((t) => t.completionSource === 'EVENT_CHECKOUT' || Boolean(t.eventId))

  const eventTx = sortedTxs.find(
    (t) => t.completionSource === 'EVENT_CHECKOUT' || Boolean(t.eventId)
  )

  const manualTx = sortedTxs.find((t) => t.completionSource === 'MANUAL')

  const isSelfEvaluated =
    node.completionSource === 'MANUAL' ||
    Boolean(manualTx) ||
    Boolean(node.selfEvaluationNote) ||
    Boolean(node.note && !isSystemRecorded) ||
    (node.isCompleted && !isSystemRecorded)

  const isParent = Boolean(node.children && node.children.length > 0)
  const isPassed = Boolean(node.isCompleted)

  // Resolve self-evaluation content: custom student note, criteria note or canonical requirement guide
  const selfEvaluationContent =
    (manualTx?.note && !isGenericText(manualTx.note) ? manualTx.note : null) ||
    (node.selfEvaluationNote && !isGenericText(node.selfEvaluationNote) ? node.selfEvaluationNote : null) ||
    (node.note && !isGenericText(node.note) ? node.note : null) ||
    SV5T_CRITERIA_GUIDES[node.criteriaId] ||
    node.name

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border/60 w-full max-w-[420px] rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Subtitle, Title & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 pr-2">
            <p className="text-xs text-muted-foreground font-medium">
              Chi tiết tiêu chí · {criteriaCode}
            </p>
            <h4 className="text-[15px] font-semibold text-foreground leading-snug">
              {node.name}
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

        {/* Trạng thái Đạt / Chưa đạt to bự, BỎ VIỀN, BỎ NỀN theo mẫu */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {isPassed ? (
              <>
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Đạt tiêu chí
                </span>
              </>
            ) : (
              <>
                <Clock className="h-7 w-7 text-muted-foreground shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-muted-foreground tracking-tight">
                  Chưa đạt tiêu chí
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isSelfEvaluated
              ? 'Theo tự đánh giá của bạn · Chưa phải kết quả chính thức'
              : isSystemRecorded
              ? 'Ghi nhận từ hoạt động của hệ thống'
              : isParent
              ? 'Cần đạt ít nhất tiêu chí nhánh để hoàn thành'
              : 'Chưa có dữ liệu ghi nhận hoàn thành'}
          </p>
        </div>

        {/* Section 1: Dữ liệu hệ thống ghi nhận (BỎ +1 đối với SV5T) */}
        <div className="space-y-1.5 pt-1">
          <h4 className="text-xs font-medium text-muted-foreground">
            Hệ thống ghi nhận
          </h4>

          {isSystemRecorded ? (
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium leading-snug">
                {eventTx?.eventName || node.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(eventTx?.createdAt || node.completedAt)}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Đã xác nhận
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-0.5">
              Chưa có hoạt động nào được ghi nhận.
            </p>
          )}
        </div>

        {/* Section 2: Sinh viên tự đánh giá (Giống bên ĐRL, BỎ +1, nút Chỉnh sửa ở dưới) */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-medium text-muted-foreground">
            Sinh viên tự đánh giá
          </h4>

          {isSelfEvaluated ? (
            <div className="space-y-1">
              <p className="text-[14px] text-foreground font-normal leading-snug">
                {selfEvaluationContent}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>
                  {formatDate(
                    manualTx?.createdAt || node.completedAt || new Date().toISOString()
                  )}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Đạt
                </span>
              </div>
              {onOpenSelfEvaluation && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSelfEvaluation(
                        manualTx?.note ||
                          (node.selfEvaluationNote && !isGenericText(node.selfEvaluationNote)
                            ? node.selfEvaluationNote
                            : '') ||
                          '',
                        isPassed
                      )
                    }
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Chỉnh sửa tự chấm
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm text-muted-foreground">
                Chưa đánh giá
              </span>
              {onOpenSelfEvaluation && (
                <button
                  type="button"
                  onClick={() => onOpenSelfEvaluation('', isPassed)}
                  className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                >
                  Tự đánh giá
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sv5tDetailModal
