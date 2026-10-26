import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

interface Sv5tSelfEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  criterionName: string
  criteriaCode: string
  isCompleted: boolean
  currentNote?: string | null
  onSave: (completed: boolean, note: string) => Promise<void> | void
}

export const Sv5tSelfEvaluationModal: React.FC<Sv5tSelfEvaluationModalProps> = ({
  isOpen,
  onClose,
  criterionName,
  criteriaCode,
  isCompleted: initialCompleted,
  currentNote = '',
  onSave,
}) => {
  const [completed, setCompleted] = useState(initialCompleted)
  const [note, setNote] = useState(currentNote || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCompleted(initialCompleted)
      setNote(currentNote || '')
      setError(null)
    }
  }, [isOpen, initialCompleted, currentNote])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSave(completed, note.trim())
      onClose()
    } catch {
      setError('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header matching SelfEvaluationModal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-base text-foreground font-heading">
              Sinh viên tự đánh giá
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              TC {criteriaCode} - {criterionName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs md:text-sm">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Field: Trạng thái tự đánh giá */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block text-xs md:text-sm">
                Trạng thái tự đánh giá <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCompleted(true)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                    completed
                      ? 'bg-[#F0FDF4] border-[#15803D] text-[#15803D] dark:bg-emerald-950/40 dark:border-emerald-600 shadow-2xs'
                      : 'bg-background border-input text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đạt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompleted(false)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                    !completed
                      ? 'bg-muted border-foreground/30 text-foreground shadow-2xs'
                      : 'bg-background border-input text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Chưa đạt</span>
                </button>
              </div>
            </div>

            {/* Field: Nội dung minh chứng / diễn giải */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block text-xs md:text-sm">
                Nội dung tự đánh giá / Minh chứng
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none"
                placeholder="Nhập ghi chú, lý do tự đánh giá hoặc dẫn link minh chứng (VD: Điểm TB 3.5, link chứng chỉ, giải thưởng đạt được...)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs md:text-sm font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
