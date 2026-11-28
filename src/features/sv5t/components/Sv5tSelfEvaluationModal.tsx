import * as Dialog from '@radix-ui/react-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Trash2 } from 'lucide-react'

interface Sv5tSelfEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  criterionName: string
  criteriaCode: string
  isCompleted: boolean
  currentNote?: string | null
  onSave: (completed: boolean, note: string) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export const Sv5tSelfEvaluationModal: React.FC<Sv5tSelfEvaluationModalProps> = ({
  isOpen,
  onClose,
  criterionName,
  criteriaCode,
  currentNote = '',
  onSave,
  onDelete,
}) => {
  const [note, setNote] = useState(currentNote || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNote(currentNote || '')
      setError(null)
    }
  }, [isOpen, currentNote])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSave(true, note.trim())
      onClose()
    } catch {
      setError('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!onDelete) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi tự đánh giá tiêu chuẩn này không?'))
      return
    try {
      setIsDeleting(true)
      setError(null)
      await onDelete()
      onClose()
    } catch {
      setError('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !(isSubmitting || isDeleting)) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            aria-describedby={undefined}
            className="pointer-events-auto student-responsive-dialog student-achievement-dialog bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Header matching SelfEvaluationModal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
              <div className="min-w-0 pr-2">
                <Dialog.Title className="font-semibold text-base text-foreground font-k2d">
                  Sinh viên tự đánh giá
                </Dialog.Title>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  TC {criteriaCode} - {criterionName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 flex flex-col gap-4 text-xs md:text-sm">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Field: Nội dung minh chứng / diễn giải */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground block text-xs md:text-sm">
                    Nội dung tự đánh giá / Minh chứng
                  </label>
                  <Textarea
                    aria-label="Nội dung tự đánh giá / Minh chứng"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting || isDeleting}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Nhập lý do ghi nhận tiêu chí"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                {onDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isSubmitting || isDeleting}
                    className="px-3 py-1.5 text-xs md:text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa đánh giá'}</span>
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting || isDeleting}
                    className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={isSubmitting || isDeleting}
                    className="px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
