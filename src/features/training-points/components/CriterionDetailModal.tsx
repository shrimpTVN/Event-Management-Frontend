import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Trash2, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  isLoading?: boolean
  loadError?: boolean
  onRetry?: () => void
  onOpenSelfEvaluation?: () => void
  onDeleteSelfEvaluation?: () => Promise<void> | void
}
function formatDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Chưa có thông tin'
  return new Date(value).toLocaleDateString('vi-VN')
}
const statusLabels: Record<PointTransaction['status'], string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  REVOKED: 'Đã thu hồi',
}
export function CriterionDetailModal({
  isOpen,
  onClose,
  criterionName,
  criteriaCode,
  maxPoints,
  recordedTransactions,
  selfScore,
  selfDescription,
  totalPoints,
  isLoading = false,
  loadError = false,
  onRetry,
  onOpenSelfEvaluation,
  onDeleteSelfEvaluation,
}: CriterionDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const records = [...recordedTransactions].sort(
    (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || b.id - a.id
  )
  const atMaximum = maxPoints > 0 && totalPoints >= maxPoints
  const progress = maxPoints > 0 ? Math.min(100, Math.max(0, (totalPoints / maxPoints) * 100)) : 0
  const handleDelete = async () => {
    if (!onDeleteSelfEvaluation || !window.confirm('Xóa bản tự đánh giá này?')) return
    setIsDeleting(true)
    setDeleteError(false)
    try {
      await onDeleteSelfEvaluation()
      onClose()
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background font-sans text-foreground shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="font-k2d text-lg font-semibold">
                Chi tiết tiêu chí {criteriaCode}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {criterionName}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Đóng"
                disabled={isDeleting}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-5">
            <section className="flex flex-col gap-3" aria-label="Tiến độ điểm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-k2d text-3xl font-bold">
                  {totalPoints}
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    / {maxPoints} điểm
                  </span>
                </p>
                {atMaximum && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Đủ điểm tối đa
                  </span>
                )}
              </div>
              <div
                role="progressbar"
                aria-label="Điểm tiêu chí"
                aria-valuemin={0}
                aria-valuemax={maxPoints}
                aria-valuenow={totalPoints}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={atMaximum ? 'h-full bg-emerald-600' : 'h-full bg-primary'}
                  style={{ width: progress + '%' }}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Điểm hệ thống và tự đánh giá được cộng tối đa {maxPoints} điểm cho tiêu chí này.
              </p>
            </section>
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">
                Dữ liệu ghi nhận{!isLoading && !loadError && ' · ' + records.length + ' bản ghi'}
              </h3>
              {isLoading ? (
                <p role="status" className="text-sm text-muted-foreground">
                  Đang tải minh chứng...
                </p>
              ) : loadError ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <p className="text-sm text-destructive">Không tải được minh chứng.</p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Thử lại
                  </Button>
                </div>
              ) : records.length ? (
                records.map((tx) => (
                  <article
                    key={tx.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="min-w-0 break-words text-sm font-medium">
                        {tx.eventId != null && tx.eventName?.trim()
                          ? tx.eventName
                          : 'Chưa xác định được hoạt động nguồn'}
                      </h4>
                      <span className="shrink-0 font-k2d text-base font-semibold">
                        {tx.points > 0 ? '+' : ''}
                        {tx.points} điểm
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Ngày diễn ra</dt>
                        <dd className="mt-1">{formatDate(tx.eventDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Ngày ghi nhận</dt>
                        <dd className="mt-1">{formatDate(tx.createdAt)}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[tx.status] || 'Chưa có trạng thái'}
                      </span>
                      {tx.eventId != null && (
                        <a
                          href={'/events/' + tx.eventId}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Xem sự kiện
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có hoạt động được ghi nhận.</p>
              )}
            </section>
            <section className="flex flex-col gap-3 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Sinh viên tự đánh giá</h3>
                <span className="font-k2d font-semibold">{selfScore} điểm</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {selfDescription || (selfScore > 0 ? 'Chưa có ghi chú.' : 'Chưa tự đánh giá.')}
              </p>
              <div className="flex flex-wrap gap-2">
                {onOpenSelfEvaluation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenSelfEvaluation}
                    disabled={isDeleting}
                  >
                    {selfScore > 0 || selfDescription ? 'Chỉnh sửa tự đánh giá' : 'Tự đánh giá'}
                  </Button>
                )}
                {onDeleteSelfEvaluation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    {isDeleting ? 'Đang xóa...' : 'Xóa tự đánh giá'}
                  </Button>
                )}
              </div>
              {deleteError && (
                <p role="alert" className="text-sm text-destructive">
                  Không xóa được tự đánh giá. Vui lòng thử lại.
                </p>
              )}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export default CriterionDetailModal
