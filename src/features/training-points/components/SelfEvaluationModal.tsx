import React, { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface SelfEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  criterionName: string
  criteriaCode: string
  maxPoints: number
  currentScore: number
  currentDescription?: string
  onSave: (points: number, description: string) => Promise<void> | void
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
}) => {
  const [points, setPoints] = useState<number>(currentScore)
  const [description, setDescription] = useState<string>(currentDescription)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-base text-foreground font-heading">
              Sinh viên tự đánh giá
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {criteriaCode} - {criterionName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs md:text-sm">
            {/* Limit notification */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
              <span>Điểm tối đa của tiêu chí này:</span>
              <span className="font-bold text-sm text-[#1B4B8A] dark:text-blue-400">
                {maxPoints} điểm
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Field: Số điểm tự đánh giá */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Số điểm tự chấm <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
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
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Nội dung tự đánh giá / Minh chứng
              </label>
              <textarea
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
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
