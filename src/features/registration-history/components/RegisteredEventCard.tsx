import React from 'react'
import { Link } from 'react-router-dom'
import {
  type RegisteredEventItem,
  normalizeHistoryStatus,
} from '../types/history.types'

interface RegisteredEventCardProps {
  event: RegisteredEventItem
  onOpenProofModal: (event: RegisteredEventItem) => void
  onOpenAbsenceModal?: (event: RegisteredEventItem) => void
  onOpenCancelModal: (event: RegisteredEventItem) => void
}

export const RegisteredEventCard: React.FC<RegisteredEventCardProps> = ({
  event,
  onOpenProofModal,
  onOpenCancelModal,
}) => {
  const normalizedStatus = normalizeHistoryStatus(event.status)
  const title = event.title || event.eventName || 'Sự kiện'
  const organizerName = event.organizer?.name || 'Ban Tổ Chức'
  const organizerAvatar = event.organizer?.avatarUrl
  const eventId = event.eventId || event.id || ''

  // Determine badge styling based on event status
  const getStatusBadge = () => {
    switch (normalizedStatus) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E9F1FC] text-[#1E5790] dark:bg-blue-950/60 dark:text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5790] dark:bg-blue-400" />
            <span>Đã đăng ký</span>
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E3F5E9] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] dark:bg-emerald-400" />
            <span>Hoàn thành</span>
          </span>
        )
      case 'ABSENT':
        return (

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E3F5E9] text-[#15803D] dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] dark:bg-emerald-400" />
            <span>Vắng</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-muted dark:text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7281] dark:bg-muted-foreground" />
            <span>Đã hủy</span>
          </span>
        )
      default:
        return null
    }
  }

  // Fallback benefits if not provided or empty
  const rawBenefits = Array.isArray(event.benefits) ? event.benefits : []
  const benefitsList =
    rawBenefits.length > 0
      ? rawBenefits
      : ([event.pointsCategory, event.criteriaSv5t].filter(Boolean) as string[])

  const extraCount =
    typeof event.extraBenefitsCount === 'number'
      ? event.extraBenefitsCount
      : Math.max(0, benefitsList.length - 2)

  // Show at most 2 benefits chips if there is an extra count
  const displayedBenefits = extraCount > 0 ? benefitsList.slice(0, 2) : benefitsList

  const canCancel = event.canCancel ?? (normalizedStatus === 'UPCOMING')

  return (
    <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg p-4 flex flex-col justify-between transition-all hover:border-[#1B4B8A]/40 hover:shadow-xs group">
      <div className="space-y-3">
        {/* Top: Status pill + Event Day */}
        <div className="flex items-center justify-between gap-2">
          {getStatusBadge()}
          <span className="text-[11px] text-[#667085] dark:text-muted-foreground font-normal">
            {event.dateHappen || 'Đang cập nhật'}
          </span>
        </div>

        {/* Title & Organizer */}
        <div className="space-y-1">
          <h3 className="font-heading font-semibold text-[13px] leading-snug line-clamp-2 text-foreground group-hover:text-[#1B4B8A] transition-colors uppercase">
            <Link to={`/events/${eventId}`}>{title}</Link>
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-muted-foreground">
            {organizerAvatar ? (
              <img
                src={organizerAvatar}
                alt={organizerName}
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                onError={(e) => {
                  ; (e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
            ) : null}
            <p className="truncate">{organizerName}</p>
          </div>
        </div>

        {/* Gray Info Box (Thời gian, Địa điểm, Số lượng, Quyền lợi) */}
        <div className="bg-[#F6F8FA] dark:bg-muted/40 rounded-[6px] p-3 space-y-2.5 text-left border border-border/40">
          {/* Thời gian */}
          <div>
            <div className="text-[10px] text-[#667085] dark:text-muted-foreground leading-tight">
              Thời gian
            </div>
            <div className="text-xs font-medium text-foreground mt-0.5 truncate">
              {event.timeHappen || 'Đang cập nhật'}
            </div>
          </div>

          {/* Địa điểm */}
          <div>
            <div className="text-[10px] text-[#667085] dark:text-muted-foreground leading-tight">
              Địa điểm
            </div>
            <div
              className="text-xs font-medium text-foreground mt-0.5 line-clamp-1"
              title={event.location || 'Hội trường Rùa'}
            >
              {event.location || 'Hội trường Rùa'}
            </div>
          </div>

          {/* Số lượng */}
          <div>
            <div className="text-[10px] text-[#667085] dark:text-muted-foreground leading-tight">
              Số lượng
            </div>
            <div className="text-xs font-medium text-foreground mt-0.5">
              {event.registeredCount
                ? `${event.registeredCount} Sinh viên`
                : event.capacity
                  ? `${event.capacity} Sinh viên`
                  : 'Không giới hạn'}
            </div>
          </div>

          {/* Quyền lợi */}
          <div>
            <div className="text-[10px] text-[#667085] dark:text-muted-foreground leading-tight mb-1">
              Quyền lợi
            </div>
            {displayedBenefits.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {displayedBenefits.map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-[#D5F6FF] text-[#0B4C6E] dark:bg-cyan-950/60 dark:text-cyan-200"
                  >
                    {benefit}
                  </span>
                ))}
                {extraCount > 0 ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[11px] font-medium bg-[#E5E7EB] text-[#6B7280] dark:bg-muted dark:text-muted-foreground">
                    +{extraCount}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Theo thông báo của ban tổ chức
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-2">
        {normalizedStatus === 'UPCOMING' && (
          <>
            <Link
              to={`/events/${eventId}`}
              className="flex-1 inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-white bg-[#235B94] hover:bg-[#1B4B8A] rounded-[6px] transition-colors shadow-2xs text-center"
            >
              Xem chi tiết
            </Link>

            {canCancel && (
              <button
                type="button"
                onClick={() => onOpenCancelModal(event)}
                className="inline-flex items-center justify-center py-2 px-3 text-xs font-medium text-[#A01F26] dark:text-rose-400 bg-white dark:bg-card border border-[#D5D5D5] dark:border-border hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[6px] transition-colors shrink-0 cursor-pointer"
              >
                Hủy đăng kí
              </button>
            )}
          </>
        )}

        {normalizedStatus === 'COMPLETED' && (
          <button
            type="button"
            onClick={() => onOpenProofModal(event)}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-white bg-[#235B94] hover:bg-[#1B4B8A] rounded-[6px] transition-colors shadow-2xs text-center cursor-pointer"
          >
            Hiện thông tin minh chứng
          </button>
        )}

        {normalizedStatus === 'ABSENT' && (
          <button
            type="button"
            onClick={() => onOpenProofModal(event)}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-[#A01F26] bg-[#FEE2E2] hover:bg-[#FCDCDC] dark:bg-rose-950/40 dark:text-rose-300 rounded-[6px] transition-colors text-center cursor-pointer"
          >
            Xem minh chứng / Khiếu nại
          </button>
        )}

        {normalizedStatus === 'CANCELLED' && (
          <div className="w-full py-2 px-3 text-xs font-medium text-muted-foreground bg-muted/50 rounded-[6px] text-center">
            Đã hủy đăng ký
          </div>
        )}
      </div>
    </div>
  )
}
