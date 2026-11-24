import * as Dialog from '@radix-ui/react-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Trash2 } from 'lucide-react'

interface SelfEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  criterionName: string
  criteriaCode: string
  maxPoints: number
  currentScore: number
  currentDescription?: string
  onSave: (points: number, description: string) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export const SelfEvaluationModal: React.FC<SelfEvaluationModalProps> = ({
  isOpen,
  onClose,
  criterionName,
  criteriaCode,
  maxPoints,
  currentScore,
  currentDescription = '',
  onSave,
  onDelete,
}) => {
  const [points, setPoints] = useState<number>(currentScore)
  const [description, setDescription] = useState<string>(currentDescription)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPoints(currentScore)
      setDescription(currentDescription)
      setError(null)
    }
  }, [isOpen, currentScore, currentDescription])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(points) || points < 0) {
      setError('Số điểm không hợp lệ (phải >= 0).')
      return
    }

    if (maxPoints > 0 && points > maxPoints) {
      setError(`Số điểm tự đánh giá không được vượt quá ${maxPoints} điểm.`)
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await onSave(points, description.trim())
      onClose()
    } catch {
      setError('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!onDelete) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return
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
        if (!open && !(isSaving || isDeleting)) onClose()
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
              <div className="min-w-0 pr-2">
                <Dialog.Title className="font-semibold text-base text-foreground font-k2d">
                  Sinh viên tự đánh giá
                </Dialog.Title>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {criteriaCode} - {criterionName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 flex flex-col gap-4 text-xs md:text-sm">
                {/* Limit notification */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-foreground text-xs flex items-center justify-between">
                  <span>Điểm tối đa của tiêu chí này:</span>
                  <span className="font-bold text-sm text-primary">{maxPoints} điểm</span>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Field: Số điểm tự đánh giá */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground block">
                    Số điểm tự chấm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      aria-label="Số điểm tự chấm"
                      inputMode="decimal"
                      min={0}
                      max={maxPoints}
                      value={points}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setPoints(isNaN(val) ? 0 : val)
                        setError(null)
                      }}
                      required
                      disabled={isSaving}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                      placeholder="Nhập số điểm tự chấm..."
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Nhập số điểm trong khoảng từ 0 đến {maxPoints} điểm.
                  </p>
                </div>

                {/* Field: Nội dung minh chứng / diễn giải */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground block">
                    Nội dung tự đánh giá / Minh chứng
                  </label>
                  <Textarea
                    aria-label="Nội dung tự đánh giá / Minh chứng"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none"
                    placeholder="Nhập ghi chú, lý do tự chấm điểm hoặc dẫn link minh chứng nếu có..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                {currentScore > 0 && onDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isSaving || isDeleting}
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
                    disabled={isSaving || isDeleting}
                    className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    disabled={isSaving || isDeleting}
                    className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu đánh giá'}
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
