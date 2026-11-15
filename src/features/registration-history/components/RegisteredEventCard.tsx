import { Tooltip } from '@/components/ui/tooltip'
import { RegisteredEventBenefits } from './RegisteredEventBenefits'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatEventTitle } from '@/shared'
import { type RegisteredEventItem, normalizeHistoryStatus } from '../types/history.types'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Calendar, MapPin, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  studentAttendanceStep,
  studentAttendanceLabel,
  studentAttendanceBadgeClass,
} from '@/shared/utils/attendanceState'

interface RegisteredEventCardProps {
  event: RegisteredEventItem
  onOpenProofModal: (event: RegisteredEventItem) => void
  onOpenAbsenceModal?: (event: RegisteredEventItem) => void
  onOpenCancelModal: (event: RegisteredEventItem) => void
  onOpenAttendanceModal?: (event: RegisteredEventItem) => void
}

export const RegisteredEventCard: React.FC<RegisteredEventCardProps> = ({
  event,
  onOpenProofModal,
  onOpenCancelModal,
  onOpenAttendanceModal,
}) => {
  const navigate = useNavigate()
  const normalizedStatus = normalizeHistoryStatus(event.status)
  const title = formatEventTitle(event.title || event.eventName || 'Sự kiện')
  const organizerName = event.organizer?.name || 'Ban Tổ Chức'
  const organizerAvatar = event.organizer?.avatarUrl
  const eventId = event.eventId || event.id || ''

  // Determine badge styling based on event status
  const getStatusBadge = () => {
    switch (normalizedStatus) {
      case 'UPCOMING':
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium',
              studentAttendanceBadgeClass(event.status)
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{studentAttendanceLabel(event.status)}</span>
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-rose-400" />
            <span>Vắng</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-muted dark:text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] dark:bg-muted-foreground" />
            <span>Đã hủy</span>
          </span>
        )
      default:
        return null
    }
  }

  const canCancel =
    (event.canCancel ?? normalizedStatus === 'UPCOMING') &&
    ['REGISTERED', 'UPCOMING', 'APPROVED'].includes(event.status)
  const isSelfAttendance = studentAttendanceStep(event.status) != null

  const handleCardClick = () => {
    navigate(`/events/${eventId}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#1B4B8A]/40 hover:shadow-xs group cursor-pointer"
    >
      <div className="space-y-3">
        {/* Top: Status pill + Event Day */}
        <div className="flex items-center justify-between gap-2">
          {getStatusBadge()}
          <span className="text-[11px] text-[#667085] dark:text-muted-foreground font-normal">
            {event.dateHappen || ''}
          </span>
        </div>

        {/* Title & Organizer (+ Poster thumbnail if available) */}
        <div className="flex items-start gap-3">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={title}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-border/60 shadow-2xs"
              loading="lazy"
            />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-[13px] sm:text-sm leading-snug line-clamp-2 text-foreground group-hover:text-[#1B4B8A] transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-muted-foreground min-w-0">
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
              <p className="truncate">{organizerName}</p>
              <VerifiedBadge className="h-3 w-3 shrink-0" />
            </div>
          </div>
        </div>

        {/* Info List (Thời gian, Địa điểm, Quyền lợi) - Tinh gọn, trực quan với Icon */}
        <div className="space-y-2 pt-1 text-left">
          {/* Thời gian */}
          <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {event.timeHappen || event.dateHappen || 'Đang cập nhật'}
            </span>
          </div>

          {/* Địa điểm */}
          <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Tooltip content={event.location || 'Hội trường Rùa'}>
              <span className="truncate">{event.location || 'Hội trường Rùa'}</span>
            </Tooltip>
          </div>

          {/* Quyền lợi */}
          <div className="flex items-start gap-2 text-xs min-w-0 pt-0.5">
            <Gift className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
              <RegisteredEventBenefits event={event} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-2">
        {normalizedStatus === 'UPCOMING' && (
          <>
            {isSelfAttendance && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAttendanceModal?.(event)
                }}
                className="flex-1 inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-[6px] transition-colors shadow-2xs text-center cursor-pointer"
              >
                {studentAttendanceStep(event.status) === 'check-out'
                  ? 'Gửi ảnh cuối buổi'
                  : 'Điểm danh'}
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenCancelModal(event)
                }}
                className={cn(
                  'inline-flex items-center justify-center py-2 px-3 text-xs font-medium text-[#A01F26] dark:text-rose-400 bg-white dark:bg-card border border-[#D5D5D5] dark:border-border hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[6px] transition-colors cursor-pointer',
                  isSelfAttendance ? 'shrink-0' : 'w-full'
                )}
              >
                Hủy đăng kí
              </button>
            )}

            {!isSelfAttendance && !canCancel && event.status !== 'SPENDING_CONFIRM' && (
              <div className="w-full py-1.5 px-2 text-[11px] font-medium text-muted-foreground bg-muted/40 rounded-[6px] text-center">
                {studentAttendanceLabel(event.status)}
              </div>
            )}
          </>
        )}

        {normalizedStatus === 'COMPLETED' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenProofModal(event)
            }}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-[#1B4B8A] dark:text-blue-400 bg-white dark:bg-card border border-[#1B4B8A]/40 hover:border-[#1B4B8A] hover:bg-[#1B4B8A]/5 dark:hover:bg-blue-950/20 rounded-[6px] transition-all text-center cursor-pointer shadow-2xs"
          >
            Xem minh chứng
          </button>
        )}

        {normalizedStatus === 'ABSENT' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenProofModal(event)
            }}
            className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold text-[#A01F26] bg-[#FEE2E2] hover:bg-[#FCDCDC] dark:bg-rose-950/40 dark:text-rose-300 rounded-[6px] transition-colors text-center cursor-pointer"
          >
            Khiếu nại / Minh chứng
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
