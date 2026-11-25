import { canStudentSelfCheck } from '@/shared/utils/attendanceConfig'
import { canCancelRegistration } from '@/shared/utils/registrationEligibility'
import { useTimeBoundary } from '@/shared/hooks/useTimeBoundary'
import { Tooltip } from '@/components/ui/tooltip'
import { RegisteredEventBenefits } from './RegisteredEventBenefits'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatEventTitle } from '@/shared'
import { type RegisteredEventItem, normalizeHistoryStatus } from '../types/history.types'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Calendar, MapPin, Gift, MoreHorizontal, UserX, Trash2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  onOpenAbsenceModal,
  onOpenCancelModal,
  onOpenAttendanceModal,
}) => {
  const navigate = useNavigate()
  const isPhone = useMediaQuery('(max-width: 767px)')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const normalizedStatus = normalizeHistoryStatus(event.status)
  const isResultRecorded = event.status === 'RECORDED'
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

  const now = useTimeBoundary(event.dateClose)
  const canCancel = canCancelRegistration(event, now)
  const isSelfAttendance = canStudentSelfCheck(event) && studentAttendanceStep(event.status) != null

  // On mobile, if self-attendance is available and secondary actions exist, show menu ⋯
  const hasSecondaryActions =
    isPhone &&
    isSelfAttendance &&
    (canCancel || (Boolean(onOpenAbsenceModal) && event.canRequestAbsence !== false))

  const handleCardClick = () => {
    navigate(`/events/${eventId}`)
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "bg-card border border-border rounded-xl transition-all hover:border-primary/40 hover:shadow-xs group cursor-pointer",
          isPhone ? "p-3.5 space-y-2.5" : "p-3.5 sm:p-4 flex flex-col justify-between"
        )}
      >
        {isPhone ? (
          /* Mobile Shopee-style Order/Event Card */
          <>
            {/* 1. Header row: Organizer on left, Status on right */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
              <div className="flex items-center gap-1.5 min-w-0">
                {organizerAvatar ? (
                  <img
                    src={organizerAvatar}
                    alt={organizerName}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : null}
                <span className="text-xs font-semibold text-foreground truncate max-w-[190px]">
                  {organizerName}
                </span>
                <VerifiedBadge className="h-3 w-3 shrink-0" />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={cn(
                    'text-xs font-semibold',
                    normalizedStatus === 'UPCOMING' && 'text-amber-600 dark:text-amber-400',
                    normalizedStatus === 'COMPLETED' &&
                      (isResultRecorded
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'),
                    normalizedStatus === 'ABSENT' && 'text-[#DC2626] dark:text-rose-400',
                    normalizedStatus === 'CANCELLED' && 'text-muted-foreground'
                  )}
                >
                  {normalizedStatus === 'ABSENT'
                    ? 'Vắng'
                    : normalizedStatus === 'CANCELLED'
                    ? 'Đã hủy'
                    : studentAttendanceLabel(event.status)}
                </span>
                {hasSecondaryActions && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(true)
                    }}
                    className="p-1 -mr-1 text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer"
                    aria-label="Tùy chọn thao tác"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Event Body: Poster on left, Title & Info on right */}
            <div className="flex items-start gap-3">
              {event.bannerUrl ? (
                <img
                  src={event.bannerUrl}
                  alt={title}
                  className="w-[76px] h-[76px] rounded-lg object-cover shrink-0 border border-border/60 shadow-2xs"
                  loading="lazy"
                />
              ) : (
                <div className="w-[76px] h-[76px] rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Calendar className="h-7 w-7 text-primary/70" />
                </div>
              )}
              <div className="space-y-1 min-w-0 flex-1 text-left">
                <h3 className="font-heading font-semibold text-[13px] leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {event.timeHappen || event.dateHappen || 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{event.location || 'Hội trường Rùa'}</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs min-w-0 pt-0.5">
                  <Gift className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                    <RegisteredEventBenefits event={event} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Shopee-style Notification / Progress Strip */}
            {normalizedStatus === 'COMPLETED' && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProofModal(event)
                }}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors',
                  isResultRecorded
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/60'
                )}
              >
                <span className="min-w-0 pr-2">
                  {isResultRecorded
                    ? '✓ Đã điểm danh thành công • Quyền lợi đã ghi nhận'
                    : 'Đã điểm danh • Quyền lợi chờ chốt kết quả'}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </div>
            )}
            {normalizedStatus === 'UPCOMING' && isSelfAttendance && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAttendanceModal?.(event)
                }}
                className="w-full bg-primary/5 text-primary border border-primary/15 px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <span className="truncate pr-2">Sẵn sàng điểm danh trực tuyến cho sự kiện này</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
              </div>
            )}
            {normalizedStatus === 'UPCOMING' && !isSelfAttendance && (
              <div className="w-full bg-muted/40 text-muted-foreground px-3 py-2 rounded-lg text-xs flex items-center justify-between">
                <span className="min-w-0">
                  {event.startsAt && Date.parse(event.startsAt) <= now
                    ? 'Đã đến thời gian diễn ra sự kiện'
                    : `Thời gian diễn ra: ${event.timeHappen || event.dateHappen || 'Đang cập nhật'}`}
                </span>
              </div>
            )}
            {normalizedStatus === 'ABSENT' && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProofModal(event)
                }}
                className="w-full bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] dark:text-rose-300 px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-rose-100/60 transition-colors"
              >
                <span className="truncate pr-2">Chưa ghi nhận điểm danh • Nhấn để gửi minh chứng</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#DC2626]" />
              </div>
            )}
            {normalizedStatus === 'CANCELLED' && (
              <div className="w-full bg-muted/40 text-muted-foreground px-3 py-2 rounded-lg text-xs">
                <span>Đã hủy đăng ký sự kiện</span>
              </div>
            )}

            {/* 4. Action Buttons (Shopee style - aligned to right) */}
            <div className="pt-2 mt-0.5 border-t border-border/40 flex items-center justify-end gap-2">
              {normalizedStatus === 'UPCOMING' && (
                <>
                  {canCancel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenCancelModal(event)
                      }}
                      className="h-9 px-3.5 text-xs font-medium text-destructive dark:text-rose-400 bg-card border border-border hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Hủy đăng kí
                    </button>
                  )}
                  {isSelfAttendance && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenAttendanceModal?.(event)
                      }}
                      className="h-9 px-4 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      {studentAttendanceStep(event.status) === 'check-out'
                        ? 'Điểm danh cuối buổi'
                        : 'Điểm danh'}
                    </button>
                  )}
                  {!isSelfAttendance && !canCancel && event.status !== 'SPENDING_CONFIRM' && (
                    <span className="text-xs font-medium text-muted-foreground py-1">
                      {studentAttendanceLabel(event.status)}
                    </span>
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
                  className="h-9 px-4 text-xs font-semibold text-primary dark:text-blue-400 bg-card border border-primary/50 hover:bg-primary/5 rounded-lg transition-all text-center cursor-pointer shadow-2xs"
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
                  className="h-9 px-4 text-xs font-semibold text-[#A01F26] bg-[#FEE2E2] hover:bg-[#FCDCDC] border border-[#FCA5A5] rounded-lg transition-colors text-center cursor-pointer"
                >
                  Khiếu nại / Minh chứng
                </button>
              )}

              {normalizedStatus === 'CANCELLED' && (
                <span className="text-xs font-medium text-muted-foreground py-1">
                  Đã hủy đăng ký
                </span>
              )}
            </div>
          </>
        ) : (
          /* Desktop Card Layout (100% Retained) */
          <>
            <div className="space-y-3">
              {/* Top: Status pill + Event Day (+ optional menu ⋯ on mobile) */}
              <div className="flex items-center justify-between gap-2">
                {getStatusBadge()}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {event.dateHappen || ''}
                  </span>
                  {hasSecondaryActions && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(true)
                      }}
                      className="p-1 -mr-1 text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer"
                      aria-label="Tùy chọn thao tác"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
                  <h3 className="font-heading font-semibold text-[13px] sm:text-sm leading-snug break-words sm:line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
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
            <div className="pt-3 mt-3 border-t border-border/40 flex flex-wrap items-center gap-2">
              {normalizedStatus === 'UPCOMING' && (
                <>
                  {isSelfAttendance && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenAttendanceModal?.(event)
                      }}
                      className={cn(
                        'inline-flex items-center justify-center min-h-11 py-2 px-3 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs text-center cursor-pointer',
                        canCancel ? 'flex-1 min-w-0' : 'w-full'
                      )}
                    >
                      {studentAttendanceStep(event.status) === 'check-out'
                        ? 'Điểm danh cuối buổi'
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
                        'inline-flex items-center justify-center min-h-11 py-2 px-3 text-xs font-medium text-destructive dark:text-rose-400 bg-card border border-border hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer',
                        isSelfAttendance ? 'flex-1 min-w-0' : 'w-full'
                      )}
                    >
                      Hủy đăng kí
                    </button>
                  )}

                  {!isSelfAttendance && !canCancel && event.status !== 'SPENDING_CONFIRM' && (
                    <div className="w-full py-2 px-3 text-xs font-medium text-muted-foreground bg-muted/40 rounded-lg text-center">
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
                  className="w-full inline-flex items-center justify-center min-h-11 py-2 px-3 text-xs font-semibold text-primary dark:text-blue-400 bg-card border border-primary/40 hover:border-primary hover:bg-primary/5 dark:hover:bg-blue-950/20 rounded-lg transition-all text-center cursor-pointer shadow-2xs"
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
                  className="w-full inline-flex items-center justify-center min-h-11 py-2 px-3 text-xs font-semibold text-[#A01F26] bg-[#FEE2E2] hover:bg-[#FCDCDC] dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition-colors text-center cursor-pointer"
                >
                  Khiếu nại / Minh chứng
                </button>
              )}

              {normalizedStatus === 'CANCELLED' && (
                <div className="w-full min-h-11 py-2 px-3 text-xs font-medium text-muted-foreground bg-muted/50 rounded-lg text-center flex items-center justify-center">
                  Đã hủy đăng ký
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile action sheet for secondary options */}
      {hasSecondaryActions && (
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col gap-2"
          >
            <SheetHeader className="pb-2 border-b border-border/60 text-left">
              <SheetTitle className="text-sm font-semibold font-heading text-foreground">
                Tùy chọn sự kiện
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 py-1">
              {onOpenAbsenceModal && event.canRequestAbsence !== false && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(false)
                    onOpenAbsenceModal(event)
                  }}
                  className="flex items-center gap-2.5 w-full py-3 px-3 text-xs font-medium text-foreground hover:bg-muted/60 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <UserX className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Gửi đơn xin vắng</span>
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(false)
                    onOpenCancelModal(event)
                  }}
                  className="flex items-center gap-2.5 w-full py-3 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="h-4 w-4 text-destructive shrink-0" />
                  <span>Hủy đăng ký sự kiện</span>
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
