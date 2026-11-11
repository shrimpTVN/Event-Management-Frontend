import React, { useState } from 'react'
import {
  Calendar,
  MapPin,
  Award,
  Users,
  AlertTriangle,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
import type { SuperAdminEvent } from '../../types/superAdmin.types'

interface EventModerationModalProps {
  event: SuperAdminEvent | null
  isOpen: boolean
  onClose: () => void
  onToggleHideEvent: (eventId: string, reason?: string) => void
}

export const EventModerationModal: React.FC<EventModerationModalProps> = ({
  event,
  isOpen,
  onClose,
  onToggleHideEvent,
}) => {
  const [violationText, setViolationText] = useState('')
  const [isHidingAction, setIsHidingAction] = useState(false)

  if (!event) return null

  const handleConfirmHide = () => {
    onToggleHideEvent(event.id, violationText || 'Vi phạm điều khoản cộng đồng và nội quy ĐHCT')
    setIsHidingAction(false)
    setViolationText('')
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0 text-left bg-white dark:bg-card border-l border-border shadow-2xl"
      >
        {/* Header Drawer */}
        <SheetHeader className="px-6 py-5 border-b border-border/80 bg-slate-50/50 dark:bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Chi tiết &amp; Kiểm duyệt sự kiện</span>
          </div>
          <SheetTitle className="text-xl font-k2d font-bold text-foreground mt-1 line-clamp-2">
            {event.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Đơn vị tổ chức: <span className="font-semibold text-primary">{event.fanpageName}</span> • ID #{event.id}
          </SheetDescription>
        </SheetHeader>

        {/* Body Drawer (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Banner & Title */}
          {event.bannerUrl && (
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-border shadow-xs relative">
              <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold shadow-md',
                    event.status === 'VIOLATED'
                      ? 'bg-red-600 text-white'
                      : event.status === 'OPEN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                  )}
                >
                  {event.status === 'VIOLATED'
                    ? 'Bị báo cáo vi phạm'
                    : event.status === 'OPEN'
                    ? 'Đang mở đăng ký'
                    : event.status === 'HAPPENING'
                    ? 'Đang diễn ra'
                    : 'Đã hoàn thành'}
                </span>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thông tin tổ chức &amp; Quyền lợi
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/60 dark:bg-muted/20 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>Thời gian: <strong className="text-foreground">{event.startDateTime}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Địa điểm: <strong className="text-foreground">{event.location}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span>Đăng ký: <strong className="text-foreground">{event.registeredCount}/{event.capacity}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary shrink-0" />
                <span>Điểm rèn luyện: <strong className="text-primary font-bold">+{event.trainingPoint} đ</strong></span>
              </div>

              <div className="sm:col-span-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
                Mục điểm: <span className="font-medium text-foreground">{event.trainingPointCategoryName}</span>
                {event.sv5tCriteriaName && (
                  <> • Tiêu chí SV5T: <span className="font-medium text-foreground">{event.sv5tCriteriaName}</span></>
                )}
              </div>
            </div>
          </div>

          {/* Violation warning if any */}
          {event.status === 'VIOLATED' && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                Cảnh Báo Vi Phạm &amp; Báo Cáo Từ Sinh Viên
              </div>
              <p className="text-xs text-red-600 dark:text-red-300">
                {event.violationReason || 'Sự kiện nhận được nhiều phản ánh không trung thực về nội dung tổ chức hoặc địa điểm.'}
              </p>
              {event.reportCount && (
                <p className="text-xs font-semibold text-red-700">Số lượt báo cáo: {event.reportCount} lượt</p>
              )}
            </div>
          )}

          {/* Reason input for hiding */}
          {isHidingAction && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Nhập lý do ẩn/hạ sự kiện:
              </p>
              <textarea
                value={violationText}
                onChange={(e) => setViolationText(e.target.value)}
                placeholder="Nhập lý do gửi đến ban tổ chức..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border border-amber-300 bg-white dark:bg-card focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsHidingAction(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white border border-border cursor-pointer hover:bg-[#F3F4F6]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHide}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-xs"
                >
                  Xác nhận Ẩn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="px-6 py-4 border-t border-border/80 bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-between gap-3">
          <div>
            {event.status === 'VIOLATED' || event.status === 'HIDDEN' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onToggleHideEvent(event.id)}
                className="gap-1.5 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Khôi phục / Bỏ ẩn sự kiện</span>
              </Button>
            ) : (
              !isHidingAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHidingAction(true)}
                  className="gap-1.5 text-xs font-semibold text-red-700 border-red-300 hover:bg-red-50 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hạ / Ẩn sự kiện vi phạm</span>
                </Button>
              )
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Đóng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
