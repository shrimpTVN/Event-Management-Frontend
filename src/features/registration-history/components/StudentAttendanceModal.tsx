import { Tooltip } from '@/components/ui/tooltip'
import React, { useEffect, useState } from 'react'
import { studentAttendanceStep } from '@/shared/utils/attendanceState'
import { Button } from '@/components/ui/button'
import { X, Trash2, AlertCircle } from 'lucide-react'
import { AttendancePhotoPicker } from './AttendancePhotoPicker'
import { sanitizeImageSrc } from '@/shared'
import { mediaService } from '@/shared/services/mediaService'
import type { RegisteredEventItem } from '../types/history.types'
import { historyService } from '../services/historyService'

interface StudentAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onSuccess: (message: string) => void
}

export const StudentAttendanceModal: React.FC<StudentAttendanceModalProps> = (props) => {
  if (!props.isOpen || !props.event) return null
  if (!studentAttendanceStep(props.event.status)) return null
  return (
    <StudentAttendanceForm
      {...props}
      key={`${props.event.eventId}:${props.event.status}:${props.event.checkInAt ?? ''}:${props.event.checkOutAt ?? ''}`}
    />
  )
}

const StudentAttendanceForm: React.FC<StudentAttendanceModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  // BE requires check-in first, then check-out, then fanpage confirmation.
  const sessionType = studentAttendanceStep(event?.status ?? '') ?? 'check-in'
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl]
  )

  if (!isOpen || !event) return null

  const title = event.title || event.eventName || 'Sự kiện'
  const eventId = String(event.eventId || event.id || '')

  const handleFileChange = (file: File) => {
    if (file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Vui lòng chỉ tải lên tệp hình ảnh (PNG, JPG, WEBP)')
        return
      }
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
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!selectedFile) {
      setError('Vui lòng tải lên ảnh minh chứng tham gia (ảnh selfie hoặc chụp tại sự kiện)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const uploadedProofUrl = await mediaService.uploadImage(selectedFile, 'EVIDENCE')
      if (!uploadedProofUrl) throw new Error('Chưa tải được ảnh minh chứng. Vui lòng thử lại.')
      await historyService.submitAttendance(eventId, sessionType, uploadedProofUrl)

      onSuccess(
        sessionType === 'check-in'
          ? 'Đã gửi ảnh điểm danh đầu buổi.'
          : 'Đã gửi ảnh cuối buổi. Chờ ban tổ chức xác nhận điểm danh.'
      )
      handleClose()
    } catch (err: any) {
      console.error('Attendance error:', err)
      const rawMsg = err?.response?.data?.message || err?.message || ''

      let friendlyMsg = 'Có lỗi xảy ra khi gửi điểm danh. Vui lòng thử lại.'
      if (rawMsg.includes('not started yet')) {
        friendlyMsg =
          'Sự kiện này chưa bắt đầu hoặc hôm nay chưa phải ngày diễn ra sự kiện (hệ thống chỉ mở điểm danh vào ngày diễn ra sự kiện).'
      } else if (rawMsg.includes('not registered')) {
        friendlyMsg = 'Bạn chưa đăng ký tham gia sự kiện này.'
      } else if (rawMsg.includes('has not checked in') || rawMsg.includes('cannot check out')) {
        friendlyMsg = 'Bạn chưa điểm danh vào (check-in) nên chưa thể điểm danh ra (check-out).'
      } else if (rawMsg.includes('pending confirmation') || rawMsg.includes('already checkout')) {
        friendlyMsg = 'Bạn đã gửi ảnh cuối buổi và đang chờ ban tổ chức xác nhận.'
      } else if (rawMsg.includes('already completed')) {
        friendlyMsg = 'Bạn đã hoàn tất điểm danh sự kiện này rồi!'
      } else if (rawMsg) {
        friendlyMsg = rawMsg
      }

      setError(friendlyMsg)
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
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-background rounded-xl shadow-xl border border-border animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Điểm danh sự kiện"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0 flex flex-col gap-1">
            <h2 className="text-base font-semibold font-heading text-foreground">
              {sessionType === 'check-in' ? 'Điểm danh đầu buổi' : 'Điểm danh cuối buổi'}
            </h2>
            <p className="text-xs text-muted-foreground break-words">{title}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng điểm danh"
            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 text-xs font-medium text-red-700 bg-rose-50 border border-rose-200 rounded-xl dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Upload Area */}
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Gửi ảnh tại sự kiện để ban tổ chức xác nhận.
            </p>

            {previewUrl && sanitizeImageSrc(previewUrl) ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20">
                <img
                  src={sanitizeImageSrc(previewUrl)}
                  alt="Ảnh minh chứng điểm danh"
                  className="w-full h-44 object-contain"
                />
                <Tooltip content="Xóa ảnh">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                    aria-label="Xóa ảnh"
                    className="absolute top-2 right-2 h-8 w-8 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </div>
            ) : null}
            <AttendancePhotoPicker disabled={isSubmitting} onSelect={handleFileChange} />
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · Tối đa 5 MB</p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 rounded-lg px-4 text-xs"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedFile ||
                (sessionType === 'check-in' ? Boolean(event.checkInAt) : Boolean(event.checkOutAt))
              }
              className="h-8 px-4 text-xs rounded-lg flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi ảnh</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
