import React, { useState } from 'react'
import { X, Calendar, MapPin, Award, Users, AlertTriangle, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react'
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

  if (!isOpen || !event) return null

  const handleConfirmHide = () => {
    onToggleHideEvent(event.id, violationText || 'Vi phạm điều khoản cộng đồng và nội quy ĐHCT')
    setIsHidingAction(false)
    setViolationText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-k2d font-bold text-foreground">Chi Tiết & Kiểm Duyệt Sự Kiện</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Banner & Title */}
          {event.bannerUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-border relative">
              <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                    event.status === 'VIOLATED'
                      ? 'bg-red-600 text-white'
                      : event.status === 'OPEN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
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

          <div>
            <h4 className="text-xl font-k2d font-bold text-foreground leading-snug">{event.title}</h4>
            <p className="text-sm text-primary font-medium mt-1">Đơn vị tổ chức: {event.fanpageName}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-[#F9FAFB] dark:bg-muted/20 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Thời gian: <strong className="text-foreground">{event.startDateTime}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Địa điểm: <strong className="text-foreground">{event.location}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Đăng ký: <strong className="text-foreground">{event.registeredCount}/{event.capacity}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span>Điểm rèn luyện: <strong className="text-primary font-bold">+{event.trainingPoint} đ</strong></span>
            </div>

            <div className="sm:col-span-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
              Mục điểm: <span className="font-medium text-foreground">{event.trainingPointCategoryName}</span>
              {event.sv5tCriteriaName && (
                <> • Tiêu chí SV5T: <span className="font-medium text-foreground">{event.sv5tCriteriaName}</span></>
              )}
            </div>
          </div>

          {/* Violation warning if any */}
          {event.status === 'VIOLATED' && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                Cảnh Báo Vi Phạm & Báo Cáo Từ Sinh Viên
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">
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
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Nhập lý do ẩn/hạ sự kiện:
              </p>
              <textarea
                value={violationText}
                onChange={(e) => setViolationText(e.target.value)}
                placeholder="Nhập lý do gửi đến ban tổ chức..."
                rows={2}
                className="w-full p-2.5 text-sm rounded-xl border border-amber-300 bg-white dark:bg-card focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-white dark:bg-card">
          <div>
            {event.status === 'VIOLATED' || event.status === 'HIDDEN' ? (
              <button
                type="button"
                onClick={() => onToggleHideEvent(event.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Khôi phục / Bỏ ẩn sự kiện
              </button>
            ) : (
              !isHidingAction && (
                <button
                  type="button"
                  onClick={() => setIsHidingAction(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                >
                  <EyeOff className="w-4 h-4" />
                  Hạ / Ẩn sự kiện vi phạm
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-card border border-border text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
