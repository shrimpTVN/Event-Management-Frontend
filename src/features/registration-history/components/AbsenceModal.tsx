import React, { useState } from 'react'
import { X, CalendarX2, UploadCloud, Trash2 } from 'lucide-react'
import { sanitizeImageSrc } from '@/shared'
import type { RegisteredEventItem, AbsenceFormData } from '../types/history.types'

interface AbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onSubmit: (data: AbsenceFormData) => void
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit,
}) => {
  const [sessionId, setSessionId] = useState('')
  const [reason, setReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !event) return null

  const title = event.title || event.eventName || 'Sự kiện'
  const sessions = Array.isArray(event.attendanceSessions) ? event.attendanceSessions : []
  const studentName = event.studentInfo?.fullName || 'Đoàn Tài Lộc'
  const studentMssv = event.studentInfo?.mssv || 'B2303827'
  const eventId = String(event.eventId || event.id || '')

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Vui lòng nhập chi tiết lý do xin vắng')
      return
    }

    onSubmit({
      eventId: eventId || 'unknown',
      sessionId: sessionId || sessions[0]?.id || 'all',
      reason,
      proofFile: selectedFile,
      proofPreviewUrl: previewUrl || undefined,
    })

    // Reset and close
    handleRemoveImage()
    setReason('')
    setSessionId('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
              <CalendarX2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                Đơn xin vắng sự kiện
              </h3>
              <p className="text-xs text-muted-foreground">
                Gửi đơn xin phép vắng đến Ban tổ chức để không bị trừ điểm uy tín
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Student & Event Information */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sinh viên:</span>
                <span className="font-medium text-foreground">
                  {studentName} ({studentMssv})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sự kiện:</span>
                <span className="font-semibold text-foreground text-right line-clamp-1 max-w-[320px]">
                  {title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian diễn ra:</span>
                <span className="font-medium text-foreground">
                  {event.timeHappen || 'Đang cập nhật'}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs dark:bg-rose-950/30 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Chọn buổi xin vắng */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Chọn buổi xin vắng <span className="text-rose-500">*</span>
              </label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-sans cursor-pointer"
              >
                {sessions.length > 0 ? (
                  sessions.map((s, idx) => (
                    <option key={s.id || idx} value={s.id || `session-${idx}`}>
                      {s.sessionName || `Buổi ${idx + 1}`}
                    </option>
                  ))
                ) : null}
                <option value="all">Toàn bộ thời gian sự kiện</option>
              </select>
            </div>

            {/* Chi tiết lý do */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Chi tiết lý do <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Nhập lý do chi tiết vì sao bạn không thể tham gia (vd: trùng lịch học, lý do sức khỏe, việc gia đình...)"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground font-sans resize-none"
              />
            </div>

            {/* Hình ảnh minh chứng (nếu có) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Hình ảnh minh chứng (nếu có)
              </label>
              {previewUrl && sanitizeImageSrc(previewUrl) ? (
                <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={sanitizeImageSrc(previewUrl)}
                      alt="Minh chứng"
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-foreground line-clamp-1">
                        {selectedFile?.name || 'Anh_minh_chung.png'}
                      </p>
                      <p className="text-muted-foreground">
                        {(Number(selectedFile?.size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                  <UploadCloud className="h-8 w-8 text-muted-foreground mb-1.5" />
                  <span className="text-xs font-medium text-primary">
                    Bấm để tải ảnh lên hoặc kéo thả vào đây
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Hỗ trợ định dạng JPG, PNG (tối đa 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs md:text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Gửi đơn xin vắng
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
