import { useEffect, useState } from 'react'
import { EyeOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  EventStatusBadge,
  AdminDetailField,
  AdminDetailSection,
  AdminDetailSheet,
} from '../AdminDetails'
import type { SuperAdminEvent } from '../../types/superAdmin.types'

interface EventModerationModalProps {
  event: SuperAdminEvent | null
  isOpen: boolean
  initialHiding?: boolean
  onClose: () => void
  onToggleHideEvent: (eventId: string, reason?: string) => void | Promise<boolean | void>
}

export function EventModerationModal({
  event,
  isOpen,
  initialHiding = false,
  onClose,
  onToggleHideEvent,
}: EventModerationModalProps) {
  const [reason, setReason] = useState('')
  const [isHiding, setIsHiding] = useState(initialHiding)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setReason('')
    setIsHiding(initialHiding)
    setIsSubmitting(false)
    setError('')
  }, [event?.id, isOpen, initialHiding])
  if (!event) return null
  const restricted = event.status === 'HIDDEN'
  const confirmHide = async () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      const ok = await onToggleHideEvent(event.id, trimmedReason)
      if (ok !== false) {
        setIsHiding(false)
        setReason('')
        onClose()
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể ẩn sự kiện. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleRestore = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      const ok = await onToggleHideEvent(event.id)
      if (ok !== false) {
        onClose()
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Không thể khôi phục sự kiện. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <AdminDetailSheet
      open={isOpen}
      onClose={onClose}
      title="Chi tiết sự kiện"
      description={`ID ${event.id} · ${event.fanpageName}`}
      footer={
        isHiding ? (
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setIsHiding(false)
                setError('')
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || isSubmitting}
              onClick={() => void confirmHide()}
            >
              {isSubmitting ? 'Đang lưu…' : 'Xác nhận ẩn sự kiện'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              className={restricted ? 'mr-auto' : 'mr-auto text-red-700 dark:text-red-300'}
              onClick={() => (restricted ? void handleRestore() : setIsHiding(true))}
            >
              {restricted ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              {isSubmitting
                ? 'Đang xử lý…'
                : restricted
                  ? 'Khôi phục sự kiện'
                  : 'Ẩn sự kiện'}
            </Button>
            <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
              Đóng
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col items-start gap-3">
        <EventStatusBadge status={event.status} />
        <h2 className="break-words font-k2d text-xl font-semibold leading-snug text-foreground">
          {event.title}
        </h2>
        {event.bannerUrl && (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="h-auto w-full rounded-xl border border-border object-contain"
          />
        )}
      </div>
      {restricted && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">Sự kiện đang bị ẩn</p>
          {event.violationReason && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {event.violationReason}
            </p>
          )}
        </div>
      )}
      <AdminDetailSection title="Thông tin tổ chức">
        <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminDetailField label="Đơn vị tổ chức" wide>
            {event.fanpageName}
          </AdminDetailField>
          <AdminDetailField label="Bắt đầu">{event.startDateTime}</AdminDetailField>
          <AdminDetailField label="Đóng đăng ký">{event.endDateTime}</AdminDetailField>
          <AdminDetailField label="Địa điểm" wide>
            {event.location}
          </AdminDetailField>
        </dl>
      </AdminDetailSection>
      <AdminDetailSection title="Đăng ký & quyền lợi">
        <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminDetailField label="Đã đăng ký / Chỉ tiêu">
            {event.registeredCount ?? 'Chưa có dữ liệu'} / {event.capacity ?? '—'}
          </AdminDetailField>
          <AdminDetailField label="Điểm rèn luyện" wide>
            {event.eventPoints?.length ? (
              <div className="flex flex-col gap-2">
                {event.eventPoints.map((point) => (
                  <span key={point.pointCategoryId}>
                    +{point.point} điểm{point.code ? ` mục ${point.code}` : ''}
                  </span>
                ))}
              </div>
            ) : (
              'Không có điểm rèn luyện'
            )}
          </AdminDetailField>
          {event.sv5tCriteriaName && (
            <AdminDetailField label="Tiêu chí sinh viên 5 tốt" wide>
              {event.sv5tCriteriaName}
            </AdminDetailField>
          )}
        </dl>
      </AdminDetailSection>
      {isHiding && (
        <AdminDetailSection title="Ẩn sự kiện">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-hide-reason">
              Lý do ẩn <span className="text-red-700">*</span>
            </Label>
            <Textarea
              id="event-hide-reason"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do gửi đến ban tổ chức..."
              rows={4}
              className="placeholder:text-gray-400"
            />
          </div>
        </AdminDetailSection>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </AdminDetailSheet>
  )
}
