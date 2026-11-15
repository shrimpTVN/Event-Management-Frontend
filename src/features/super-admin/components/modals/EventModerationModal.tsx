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
  onClose: () => void
  onToggleHideEvent: (eventId: string, reason?: string) => void
}

export function EventModerationModal({
  event,
  isOpen,
  onClose,
  onToggleHideEvent,
}: EventModerationModalProps) {
  const [reason, setReason] = useState('')
  const [isHiding, setIsHiding] = useState(false)
  useEffect(() => {
    setReason('')
    setIsHiding(false)
  }, [event?.id, isOpen])
  if (!event) return null
  const restricted = event.status === 'VIOLATED' || event.status === 'HIDDEN'
  const confirmHide = () => {
    onToggleHideEvent(event.id, reason.trim() || 'Vi phạm điều khoản cộng đồng và nội quy ĐHCT')
    setIsHiding(false)
    setReason('')
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
            <Button variant="outline" onClick={() => setIsHiding(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmHide}>
              Xác nhận ẩn sự kiện
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className={restricted ? 'mr-auto' : 'mr-auto text-red-700 dark:text-red-300'}
              onClick={() => (restricted ? onToggleHideEvent(event.id) : setIsHiding(true))}
            >
              {restricted ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              {restricted ? 'Khôi phục sự kiện' : 'Ẩn sự kiện'}
            </Button>
            <Button variant="outline" onClick={onClose}>
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
          <p className="font-semibold">
            {event.status === 'HIDDEN' ? 'Sự kiện đang bị ẩn' : 'Báo cáo vi phạm'}
          </p>
          {event.violationReason && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {event.violationReason}
            </p>
          )}
          {Boolean(event.reportCount) && <p>{event.reportCount} lượt báo cáo</p>}
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
            <Label htmlFor="event-hide-reason">Lý do ẩn</Label>
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
    </AdminDetailSheet>
  )
}
