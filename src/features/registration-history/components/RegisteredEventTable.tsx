import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Award } from 'lucide-react'
import { formatEventTitle } from '@/shared'
import {
  type RegisteredEventItem,
  normalizeHistoryStatus,
} from '../types/history.types'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { cn } from '@/lib/utils'

interface RegisteredEventTableProps {
  events: RegisteredEventItem[]
  onOpenProofModal: (event: RegisteredEventItem) => void
  onOpenAbsenceModal?: (event: RegisteredEventItem) => void
  onOpenCancelModal: (event: RegisteredEventItem) => void
  onOpenAttendanceModal?: (event: RegisteredEventItem) => void
}

export const RegisteredEventTable: React.FC<RegisteredEventTableProps> = ({
  events,
  onOpenProofModal,
  onOpenCancelModal,
  onOpenAttendanceModal,
}) => {
  const navigate = useNavigate()

  const getStatusBadge = (status: string) => {
    const normalized = normalizeHistoryStatus(status)
    switch (normalized) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E9F1FC] text-[#1E5790] dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5790] dark:bg-blue-400 shrink-0" />
            <span>Đã đăng ký</span>
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E3F5E9] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] dark:bg-emerald-400 shrink-0" />
            <span>Hoàn thành</span>
          </span>
        )
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-rose-400 shrink-0" />
            <span>Vắng</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#6B7280] dark:bg-muted dark:text-muted-foreground whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] dark:bg-muted-foreground shrink-0" />
            <span>Đã hủy</span>
          </span>
        )
      default:
        return null
    }
  }

  // Tinh gọn quyền lợi: Bỏ các từ schema dài dòng như "Mã tiêu chí:"
  const cleanBenefitText = (text: string): string => {
    return text
      .replace(/Mã tiêu chí:\s*/gi, 'Điều ')
      .replace(/Tiêu chí\s*/gi, '')
      .trim()
  }

  return (
    <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 rounded-2xl overflow-x-auto custom-scrollbar border border-border/40">
      <div className="min-w-[860px]">
        {/* Header hàng cột phẳng, chữ xám nhẹ chuẩn Fanpage Admin (Tên sự kiện đứng đầu) */}
        <div className="grid grid-cols-12 items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
          <div className="col-span-4">Sự kiện & Ban tổ chức</div>
          <div className="col-span-3">Thời gian & Địa điểm</div>
          <div className="col-span-2">Quyền lợi</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>

        {/* Danh sách các hàng sự kiện dạng Floating Rounded Cards giống Fanpage Admin */}
        <div className="flex flex-col gap-2.5 mt-1">
          {events.map((event, idx) => {
            const eventId = event.eventId || event.id || ''
            const title = formatEventTitle(event.title || event.eventName || 'Sự kiện')
            const organizerName = event.organizer?.name || 'Ban Tổ Chức'
            const organizerAvatar = event.organizer?.avatarUrl
            const normalizedStatus = normalizeHistoryStatus(event.status)
            const isSelfAttendance = event.attendanceMethod === 'STUDENT_PROOF'
            const canCancel = event.canCancel ?? (normalizedStatus === 'UPCOMING')

            const rawBenefits = Array.isArray(event.benefits) ? event.benefits : []
            const benefitsList =
              rawBenefits.length > 0
                ? rawBenefits
                : ([event.pointsCategory, event.criteriaSv5t].filter(Boolean) as string[])
            const extraCount =
              typeof event.extraBenefitsCount === 'number'
                ? event.extraBenefitsCount
                : Math.max(0, benefitsList.length - 2)
            const displayedBenefits = extraCount > 0 ? benefitsList.slice(0, 2) : benefitsList

            return (
              <div
                key={eventId || idx}
                onClick={() => navigate(`/events/${eventId}`)}
                className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid grid-cols-12 items-center group cursor-pointer"
              >
                {/* 1. Sự kiện & BTC (Thumbnail 44x44px + Tiêu đề + Đơn vị) - Cột đầu tiên */}
                <div className="col-span-4 min-w-0 pr-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={title}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border/40 shadow-2xs"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                        {title.charAt(0)}
                      </div>
                    )}

                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <h4 className="font-heading font-semibold text-xs sm:text-[13px] text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                        {title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {organizerAvatar ? (
                          <img
                            src={organizerAvatar}
                            alt={organizerName}
                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : null}
                        <span className="truncate max-w-[180px]">{organizerName}</span>
                        <VerifiedBadge className="h-3 w-3 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Thời gian & Địa điểm */}
                <div className="col-span-3 space-y-1 text-xs pr-3">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{event.timeHappen || event.dateHappen || 'Đang cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]" title={event.location || 'Hội trường Rùa'}>
                      {event.location || 'Hội trường Rùa'}
                    </span>
                  </div>
                </div>

                {/* 3. Quyền lợi */}
                <div className="col-span-2 pr-2" onClick={(e) => e.stopPropagation()}>
                  {displayedBenefits.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {displayedBenefits.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-[#EFF5FC] text-[#065C85] dark:bg-blue-950/60 dark:text-blue-300"
                        >
                          <Award className="h-2.5 w-2.5 text-primary shrink-0" />
                          <span className="truncate max-w-[130px]">{cleanBenefitText(b)}</span>
                        </span>
                      ))}
                      {extraCount > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[10px] font-medium bg-muted text-muted-foreground">
                          +{extraCount}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">
                      Theo thông báo BTC
                    </span>
                  )}
                </div>

                {/* 4. Trạng thái (Căn giữa theo trục dọc chuẩn chỉnh) */}
                <div className="col-span-2 flex items-center pr-2">
                  {getStatusBadge(event.status)}
                </div>

                {/* 5. Nút Thao tác (Căn giữa theo trục dọc, không còn lệch) */}
                <div className="col-span-1 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                  {normalizedStatus === 'UPCOMING' && (
                    <div className="flex items-center gap-1.5">
                      {isSelfAttendance && (
                        <button
                          type="button"
                          onClick={() => onOpenAttendanceModal?.(event)}
                          className="h-7 px-2.5 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          Điểm danh
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => onOpenCancelModal(event)}
                          className={cn(
                            'h-7 px-2.5 text-xs font-medium text-[#A01F26] dark:text-rose-400 bg-white dark:bg-card border border-[#D5D5D5] dark:border-border hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                            !isSelfAttendance && 'w-full'
                          )}
                        >
                          Hủy
                        </button>
                      )}
                      {!isSelfAttendance && !canCancel && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Đã đăng ký
                        </span>
                      )}
                    </div>
                  )}

                  {normalizedStatus === 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => onOpenProofModal(event)}
                      className="h-7 px-3 text-xs font-semibold text-[#1B4B8A] dark:text-blue-400 bg-white dark:bg-card border border-[#1B4B8A]/40 hover:border-[#1B4B8A] hover:bg-[#1B4B8A]/5 dark:hover:bg-blue-950/20 rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      Minh chứng
                    </button>
                  )}

                  {normalizedStatus === 'ABSENT' && (
                    <button
                      type="button"
                      onClick={() => onOpenProofModal(event)}
                      className="h-7 px-2.5 text-xs font-semibold text-[#A01F26] bg-[#FEE2E2] hover:bg-[#FCDCDC] dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Khiếu nại
                    </button>
                  )}

                  {normalizedStatus === 'CANCELLED' && (
                    <span className="text-xs text-muted-foreground italic whitespace-nowrap">
                      Đã hủy
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
