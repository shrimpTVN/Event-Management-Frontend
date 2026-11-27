import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  User,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eventService, type Event } from '@/features/events'
import { profileService } from '@/features/profile'
import { registrationService } from '../services/registrationService'

interface RegistrationFormProps {
  eventId: string
  onSubmitSuccess?: () => void
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ eventId, onSubmitSuccess }) => {
  const queryClient = useQueryClient()
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [committed, setCommitted] = useState(true)

  // 1. Fetch current student profile via profileService (supports UserInfoResponseDto)
  const { data: profile } = useQuery<any>({
    queryKey: ['student', 'profile', 'me'],
    queryFn: () => profileService.getMyProfile(),
  })

  // 2. Fetch target event info using the same normalized shape and cache key as EventDetailPage
  const {
    data: event,
    isLoading: isLoadingEvent,
    isError: isEventError,
    refetch: refetchEvent,
  } = useQuery<Event>({
    queryKey: ['events', eventId],
    queryFn: () => eventService.getEventById(eventId),
    enabled: Boolean(eventId),
  })

  const isEventValid = Boolean(event?.id && (event?.title || (event as any)?.name))
  const canSubmit = Boolean(eventId) && !isLoadingEvent && !isEventError && isEventValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      setErrorMessage('Không có thông tin sự kiện hợp lệ để gửi đăng ký.')
      return
    }
    if (!committed) {
      setErrorMessage('Vui lòng xác nhận cam kết tham gia sự kiện.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      await registrationService.registerForEvent(eventId, {
        fullName: profile?.fullName || profile?.name || 'Chưa cập nhật',
        email: profile?.email || 'Chưa cập nhật',
      })
      queryClient.setQueryData<Event>(['events', eventId], (old) =>
        old
          ? {
              ...old,
              isRegistered: true,
              registrationStatus: 'REGISTERED',
              registeredCount: (old.registeredCount || 0) + 1,
            }
          : old
      )
      queryClient.setQueriesData<Record<string, string>>(
        { queryKey: ['registrations', 'me'] },
        (old) => ({
          ...(old && !Array.isArray(old) ? old : {}),
          [String(eventId)]: 'REGISTERED',
        })
      )
      void queryClient.invalidateQueries({ queryKey: ['registrations'] })
      void queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
      setSubmitted(true)
      onSubmitSuccess?.()
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          'Không thể đăng ký sự kiện lúc này. Có thể bạn đã đăng ký hoặc sự kiện đã đủ số lượng.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-sm text-center space-y-6 animate-in fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Đăng ký sự kiện thành công!
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Hệ thống đã ghi nhận đăng ký tham gia sự kiện của bạn. Vui lòng có mặt đúng giờ và quét
            mã/chụp ảnh điểm danh tại sự kiện.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/history"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow hover:bg-primary/90 transition-colors"
          >
            Xem lịch sử đăng ký
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-colors"
          >
            Khám phá sự kiện khác
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-8 shadow-sm flex flex-col gap-4 sm:gap-6 text-left">
      <div>
        <h1 className="font-k2d font-bold text-2xl text-foreground">Xác nhận đăng ký tham gia</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Kiểm tra thông tin cá nhân và quyền lợi sự kiện trước khi hoàn tất đăng ký.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Event Overview Box */}
      {!eventId || isEventError || (!isLoadingEvent && !isEventValid) ? (
        <div
          role="alert"
          className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive space-y-2"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {!eventId
                ? 'Không xác định được sự kiện cần đăng ký.'
                : 'Không tải được thông tin sự kiện hợp lệ.'}
            </span>
          </div>
          <p className="text-xs text-destructive/90">
            Vui lòng thử tải lại thông tin sự kiện trước khi xác nhận đăng ký.
          </p>
          {eventId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetchEvent()}
              className="inline-flex items-center gap-1.5 text-xs bg-background text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
            Sự kiện đăng ký
          </span>
          <h3 className="font-semibold text-sm text-foreground">
            {isLoadingEvent
              ? 'Đang tải thông tin...'
              : event?.title || (event as any)?.name || '—'}
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {event?.dateHappen || event?.startTime
                ? new Date(event.dateHappen || event.startTime).toLocaleDateString('vi-VN')
                : '—'}
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              {event?.pointsReward || 'Theo quy định sự kiện'}
            </span>
          </div>
        </div>
      )}

      {/* Student Profile Info Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <User className="h-4 w-4 text-primary" />
          <span>THÔNG TIN SINH VIÊN XÁC NHẬN</span>
        </div>

        <div className="student-registration-identity grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-[#F9FAFB] dark:bg-background/60 text-xs">
          <div>
            <span className="text-muted-foreground">Họ và tên:</span>
            <p className="font-semibold text-foreground text-sm">
              {profile?.fullName || profile?.name || 'Chưa cập nhật'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Mã số sinh viên (MSSV):</span>
            <p className="font-semibold text-foreground text-sm font-mono">
              {profile?.studentId || 'Chưa cập nhật'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Lớp sinh hoạt:</span>
            <p className="font-semibold text-foreground">{profile?.classId || 'Chưa cập nhật'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ngành học:</span>
            <p className="font-semibold text-foreground">
              {profile?.major || profile?.majorName || 'Chưa cập nhật'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Email trường:</span>
            <p className="font-semibold text-foreground font-mono">
              {profile?.email || 'Chưa cập nhật'}
            </p>
          </div>
        </div>
      </div>

      {/* Rules Commitment Checkbox */}
      <form onSubmit={handleSubmit} className="student-registration-form flex flex-col gap-5">
        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer text-xs">
          <Input
            type="checkbox"
            checked={committed}
            onChange={(e) => setCommitted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <span className="text-foreground leading-relaxed">
            Tôi cam kết tham gia đúng giờ, chấp hành nghiêm túc nội quy sự kiện và thực hiện điểm
            danh theo quy định để được ghi nhận Điểm Rèn Luyện.
          </span>
        </label>

        <Button
          type="submit"
          disabled={isSubmitting || !committed || !canSubmit}
          className="student-registration-submit w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang gửi đăng ký...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Xác nhận tham gia sự kiện</span>
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
