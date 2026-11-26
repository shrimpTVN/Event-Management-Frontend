import { Button } from '@/components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import { X, CheckCircle2, Clock, Trash2, ArrowUpRight } from 'lucide-react'
import type { CriteriaProgressNode, CriteriaTransaction } from '../types/sv5t.types'
import { sv5tService } from '../services/sv5tService'

interface Sv5tDetailModalProps {
  isOpen: boolean
  onClose: () => void
  node: CriteriaProgressNode
  criteriaCode: string
  academicYearId?: number
  onOpenSelfEvaluation?: (
    currentNote?: string,
    isCompleted?: boolean,
    transactionId?: number
  ) => void
  onDeleteManualTransaction?: (transactionId: number, criteriaId: number) => Promise<void> | void
}
function formatDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Chưa có thông tin'
  return new Date(value).toLocaleDateString('vi-VN')
}
const isSystemTransaction = (tx: CriteriaTransaction) =>
  tx.completionSource === 'EVENT_CHECKOUT' || tx.completionSource === 'SYSTEM' || tx.eventId != null

export function Sv5tDetailModal({
  isOpen,
  onClose,
  node,
  criteriaCode,
  academicYearId,
  onOpenSelfEvaluation,
  onDeleteManualTransaction,
}: Sv5tDetailModalProps) {
  const [transactions, setTransactions] = useState<CriteriaTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [reload, setReload] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  useEffect(() => {
    let active = true
    setTransactions([])
    setLoadError(false)
    setDeleteError(false)
    if (!isOpen || !node.criteriaId || !academicYearId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    sv5tService
      .getCriteriaTransactions(node.criteriaId, academicYearId)
      .then((list) => {
        if (active) setTransactions(list.filter((tx) => tx.isActive !== false))
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [isOpen, node.criteriaId, academicYearId, reload])

  const sorted = [...transactions].sort(
    (a, b) =>
      (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0) ||
      Number(b.id) - Number(a.id)
  )
  const systemRecords = sorted.filter(isSystemTransaction)
  const activities = systemRecords.filter(
    (tx, index, all) =>
      all.findIndex((other) =>
        tx.eventId != null ? String(other.eventId) === String(tx.eventId) : other.id === tx.id
      ) === index
  )
  const selfEvaluated = node.isSelfEvaluated
  const manualRecords = sorted.filter((transaction) => transaction.completionSource === 'MANUAL')
  const displayedManualRecords: CriteriaTransaction[] = manualRecords.length
    ? manualRecords
    : selfEvaluated && node.manualTransactionId != null
      ? [{ id: node.manualTransactionId, note: node.selfEvaluationNote }]
      : []
  const systemRecorded = node.isSystemRecorded
  const isParent = !node.isLeaf
  const required = (isParent ? node.requiredChildren : node.requiredOccurrences) ?? 0
  const recorded = (isParent ? node.completedChildren : node.recordedOccurrences) ?? 0
  const unit = isParent ? 'tiêu chí' : 'lần'
  const passed = Boolean(node.isCompleted)
  const deleteManual = async (transactionId: number) => {
    if (!onDeleteManualTransaction || isDeleting) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi tự đánh giá tiêu chuẩn này không?'))
      return
    setIsDeleting(true)
    setDeleteError(false)
    try {
      await onDeleteManualTransaction(transactionId, node.criteriaId)
      setReload((value) => value + 1)
    } catch {
      setDeleteError(true)
    } finally {
      setIsDeleting(false)
    }
  }
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="student-responsive-dialog student-achievement-dialog fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-left font-sans text-foreground shadow-xl focus:outline-none">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="font-k2d text-xl font-semibold">
                Chi tiết tiêu chí {criteriaCode}
              </Dialog.Title>
              <p className="text-xs text-muted-foreground">Sinh viên 5 tốt</p>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                aria-label="Đóng"
                className="h-8 w-8 shrink-0 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="flex flex-col gap-6 overflow-y-auto p-5 sm:p-6">
            <section className="flex flex-col gap-4" aria-label="Tiến độ và điều kiện">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`flex items-center gap-2 text-base font-semibold ${passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}
                >
                  {passed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>{passed ? 'Đạt tiêu chí' : 'Chưa đạt tiêu chí'}</span>
                </div>
                {(isParent || required > 1 || systemRecorded) && (
                  <span className="font-k2d text-xl font-semibold tabular-nums">
                    {recorded}/{required} {unit}
                  </span>
                )}
              </div>
              {(isParent || required > 1) && (
                <div
                  role="progressbar"
                  aria-label="Tiến độ ghi nhận"
                  aria-valuemin={0}
                  aria-valuemax={required}
                  aria-valuenow={Math.min(recorded, required)}
                  aria-valuetext={`${recorded}/${required} ${unit}`}
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full ${passed ? 'bg-emerald-600' : 'bg-primary'}`}
                    style={{ width: `${node.completionPercentage ?? 0}%` }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-lg bg-card p-4">
                <h3 className="text-xs font-medium text-muted-foreground">Điều kiện cần đạt</h3>
                <Dialog.Description className="text-sm leading-relaxed">
                  {node.name}
                </Dialog.Description>
                {node.note && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{node.note}</p>
                )}
              </div>
            </section>
            <section
              className="flex flex-col gap-3 border-t border-border pt-5"
              aria-label="Hoạt động ghi nhận"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">Hoạt động ghi nhận</h3>
                {activities.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {activities.length}{' '}
                    {activities.every((tx) => tx.eventId != null) ? 'hoạt động' : 'bản ghi'}
                  </span>
                )}
              </div>
              {isLoading ? (
                <p role="status" className="text-sm text-muted-foreground">
                  Đang tải hoạt động...
                </p>
              ) : loadError ? (
                <div role="alert" className="flex flex-col items-start gap-2">
                  <p className="text-sm text-muted-foreground">
                    Không tải được hoạt động ghi nhận.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReload((value) => value + 1)}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : !academicYearId ? (
                <p className="text-sm text-muted-foreground">
                  Chọn năm học để xem hoạt động ghi nhận.
                </p>
              ) : activities.length ? (
                <ul className="flex flex-col gap-3">
                  {activities.map((tx) => (
                    <li
                      key={tx.eventId != null ? `event-${tx.eventId}` : `record-${tx.id}`}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4"
                    >
                      <p className="break-words text-sm font-medium leading-relaxed">
                        {tx.eventId != null && tx.eventName?.trim()
                          ? tx.eventName
                          : 'Chưa xác định được hoạt động nguồn'}
                      </p>
                      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground">Ngày diễn ra</dt>
                          <dd>{formatDate(tx.eventDate)}</dd>
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground">Ngày ghi nhận</dt>
                          <dd>{formatDate(tx.createdAt)}</dd>
                        </div>
                      </dl>
                      {tx.eventId != null && (
                        <a
                          href={`/events/${encodeURIComponent(String(tx.eventId))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-8 items-center gap-1 self-start rounded-lg text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          Xem sự kiện
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {systemRecorded
                    ? 'Chưa có chi tiết hoạt động để hiển thị.'
                    : 'Chưa có hoạt động nào được ghi nhận.'}
                </p>
              )}
            </section>
            <section
              className="flex flex-col gap-3 border-t border-border pt-5"
              aria-label="Sinh viên tự đánh giá"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Sinh viên tự đánh giá</h3>
                <span className="text-xs text-muted-foreground">
                  {selfEvaluated ? (passed ? 'Đạt' : 'Chưa đạt') : 'Chưa đánh giá'}
                </span>
              </div>
              {deleteError && (
                <p role="alert" className="text-sm text-destructive">
                  Chưa xóa được tự đánh giá. Vui lòng thử lại.
                </p>
              )}
              {displayedManualRecords.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {displayedManualRecords.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="flex flex-col items-start gap-3 py-4 first:pt-0"
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {transaction.note || 'Chưa có ghi chú tự đánh giá'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ngày ghi nhận {formatDate(transaction.createdAt)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {onOpenSelfEvaluation && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() =>
                              onOpenSelfEvaluation(
                                transaction.note ?? '',
                                true,
                                Number(transaction.id)
                              )
                            }
                          >
                            Chỉnh sửa tự chấm
                          </Button>
                        )}
                        {onDeleteManualTransaction && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isDeleting}
                            onClick={() => void deleteManual(Number(transaction.id))}
                            className="gap-1.5 text-muted-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Xóa tự chấm
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !isLoading &&
                !loadError && <p className="text-sm text-muted-foreground">Chưa có ghi nhận tay.</p>
              )}
              {onOpenSelfEvaluation && node.isLeaf && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => onOpenSelfEvaluation('', Boolean(selfEvaluated))}
                >
                  {selfEvaluated ? 'Thêm ghi nhận tay' : 'Tự đánh giá'}
                </Button>
              )}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export default Sv5tDetailModal
