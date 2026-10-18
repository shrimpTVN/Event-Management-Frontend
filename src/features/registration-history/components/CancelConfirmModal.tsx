import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { RegisteredEventItem } from '../types/history.types'

interface CancelConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onConfirm: (event: RegisteredEventItem) => void
}

export const CancelConfirmModal: React.FC<CancelConfirmModalProps> = ({
  isOpen,
  onClose,
  event,
  onConfirm,
}) => {
  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-1">
              Hủy đăng ký sự kiện?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện <br />
              <span className="font-semibold text-foreground">"{event.title}"</span>?
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground text-left">
            ⚠️ <strong>Lưu ý:</strong> Hủy đăng ký trước khi sự kiện diễn ra sẽ nhường lại chỉ tiêu cho các sinh viên khác và không ảnh hưởng đến điểm rèn luyện của bạn.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:bg-muted/80 rounded-xl transition-colors"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(event)
              onClose()
            }}
            className="px-5 py-2 text-xs md:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  )
}
