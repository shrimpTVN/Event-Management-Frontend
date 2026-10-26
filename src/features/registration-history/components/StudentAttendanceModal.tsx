import React, { useState } from 'react'
import { X, Camera, UploadCloud, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { RegisteredEventItem } from '../types/history.types'
import { historyService } from '../services/historyService'

interface StudentAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onSuccess: (message: string) => void
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  const attendanceSessionType = event?.attendanceSessionType || 'BOTH'

  // Available sessions to check in based on event configuration
  const allowCheckIn = attendanceSessionType === 'CHECK_IN' || attendanceSessionType === 'BOTH'
  const allowCheckOut = attendanceSessionType === 'CHECK_OUT' || attendanceSessionType === 'BOTH'

  const [sessionType, setSessionType] = useState<'check-in' | 'check-out'>(
    allowCheckIn ? 'check-in' : 'check-out'
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !event) return null

  const title = event.title || event.eventName || 'Sự kiện'
  const eventId = String(event.eventId || event.id || '')
  const organizerName = event.organizer?.name || 'Ban Tổ Chức'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError(null)
    }
  }

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!previewUrl && !selectedFile) {
      setError('Vui lòng tải lên ảnh minh chứng tham gia (ảnh selfie hoặc chụp tại sự kiện)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Mock proof URL fallback for demo environment
      const proofUrl =
        previewUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop'

      await historyService.submitAttendance(eventId, sessionType, proofUrl)

      onSuccess(
        sessionType === 'check-in'
          ? 'Điểm danh đầu buổi thành công!'
          : 'Điểm danh cuối buổi thành công!'
      )
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gửi điểm danh. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    handleRemoveImage()
    setError(null)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1B4B8A] dark:bg-blue-950/60 dark:text-blue-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-foreground">
                Điểm danh sự kiện
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-xs">{title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Quick Info */}
          <div className="p-3 bg-[#F8FAFC] dark:bg-muted/30 border border-[#EDF2F7] dark:border-border/40 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ban tổ chức:</span>
              <span className="font-semibold text-foreground truncate">{organizerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời gian:</span>
              <span className="font-medium text-foreground">{event.timeHappen || 'Đang cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Địa điểm:</span>
              <span className="font-medium text-foreground truncate">{event.location || 'Hội trường Rùa'}</span>
            </div>
          </div>

          {/* Session Selection (Đầu buổi vs Cuối buổi) */}
          {allowCheckIn && allowCheckOut && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Chọn phiên điểm danh <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSessionType('check-in')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sessionType === 'check-in'
                      ? 'border-[#1B4B8A] bg-blue-50/70 text-[#1B4B8A] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                      : 'border-border bg-white dark:bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${sessionType === 'check-in' ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Điểm danh đầu buổi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionType('check-out')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sessionType === 'check-out'
                      ? 'border-[#1B4B8A] bg-blue-50/70 text-[#1B4B8A] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                      : 'border-border bg-white dark:bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${sessionType === 'check-out' ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Điểm danh cuối buổi</span>
                </button>
              </div>
            </div>
          )}

          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Ảnh minh chứng tham gia sự kiện <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Chụp ảnh selfie tại hội trường hoặc ảnh chụp cùng slide/sân khấu sự kiện để BTC xác minh.
            </p>

            {previewUrl ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20">
                <img
                  src={previewUrl}
                  alt="Ảnh minh chứng điểm danh"
                  className="w-full h-44 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border/80 rounded-xl hover:border-[#1B4B8A]/60 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <UploadCloud className="w-7 h-7 text-[#1B4B8A] mb-2" />
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Nhấp để tải ảnh lên hoặc kéo thả vào đây
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hỗ trợ định dạng PNG, JPG, JPEG (tối đa 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi điểm danh...</span>
                </>
              ) : (
                <span>Xác nhận điểm danh</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
