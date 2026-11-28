import { Button } from '@/components/ui/button'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CalendarCheck,
  Ban,
  GraduationCap,
} from 'lucide-react'
import { apiClient } from '@/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
import { canCancelRegistration } from '@/shared/utils/registrationEligibility'
import { getApiErrorCode, resolveApiErrorMessage } from '@/shared/utils/apiError'
import { useTimeBoundary } from '@/shared/hooks/useTimeBoundary'

export interface RegisterButtonProps {
  eventId: string | number
  eventTitle?: string
  dateClose?: string | null
  isRegistered?: boolean
  registrationStatus?: 'REGISTERED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | string
  disabled?: boolean
  disabledReason?: 'closed' | 'full' | 'unavailable'
  className?: string
  size?: 'sm' | 'md' | 'lg'
  compact?: boolean
  label?: string
  onRegisteredClick?: () => void
  onRegisterSuccess?: () => void
  onCancelSuccess?: () => void
}

/**
 * RegisterButton Component matching Figma Specs:
 * - Button variants: Node 872:5539 (Default, Hover, Pressed, Focus, Disabled, Loading, Success, SuccessOpen, Error)
 * - Overlay dropdown: Node 910:4855 (Quản lý sự kiện, Hủy đăng ký)
 */
export const RegisterButton: React.FC<RegisterButtonProps> = ({
  eventId,
  eventTitle,
  dateClose,
  isRegistered: initialRegistered = false,
  registrationStatus: initialStatus,
  disabled = false,
  disabledReason = 'unavailable',
  className = '',
  size = 'md',
  compact = false,
  label,
  onRegisteredClick,
  onRegisterSuccess,
  onCancelSuccess,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const [isRegistered, setIsRegistered] = useState(initialRegistered)
  const [registrationStatus, setRegistrationStatus] = useState<string | undefined>(initialStatus)
  const now = useTimeBoundary(dateClose)
  const canCancel = canCancelRegistration({ status: registrationStatus, dateClose }, now)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    message: string
    requiresProfile?: boolean
  }>({
    isOpen: false,
    message: '',
    requiresProfile: false,
  })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync prop changes
  useEffect(() => {
    setIsRegistered(initialRegistered)
  }, [initialRegistered])

  useEffect(() => {
    setRegistrationStatus(initialStatus)
  }, [initialStatus])

  // Smart positioning calculation (flips upward if near bottom of viewport)
  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const shouldOpenUpward = spaceBelow < 120 // ~90px menu height + margin

    const right = Math.max(8, window.innerWidth - rect.right)

    if (shouldOpenUpward) {
      setDropdownStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 6}px`,
        right: `${right}px`,
        zIndex: 9999,
      })
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        right: `${right}px`,
        zIndex: 9999,
      })
    }
  }

  // Recalculate position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return
    updatePosition()

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen])

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle register action (Quick register)
  const handleRegister = async () => {
    if (disabled || isLoading) return

    // 1. Kiểm tra đăng nhập
    if (!isAuthenticated || !user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // 2. Kiểm tra thông tin sinh viên - chỉ yêu cầu khi sinh viên chưa hoàn thiện hồ sơ
    if (user.role === 'STUDENT' && (user.isProfileComplete === false || !user.studentId)) {
      setShowProfilePrompt(true)
      return
    }

    setIsLoading(true)

    try {
      // Small minimum processing threshold (e.g. 500ms) so user can see "Đang xử lý" smoothly
      const minDelay = new Promise((resolve) => setTimeout(resolve, 500))

      const request = (async () => {
        try {
          return await apiClient.post(`/registrations/me/events/${eventId}`)
        } catch (err: any) {
          // If 404, fallback to alternative endpoints
          if (err?.response?.status === 404) {
            try {
              return await apiClient.post(`/events/${eventId}/register`)
            } catch {
              return await apiClient.post('/registrations', { eventId: Number(eventId) })
            }
          }
          throw err
        }
      })()

      await Promise.all([request, minDelay])

      setIsRegistered(true)
      setRegistrationStatus('REGISTERED')
      queryClient.setQueryData(['registrations', 'me', isAuthenticated], (old: any[] = []) => [
        ...(Array.isArray(old) ? old : []),
        { eventId: Number(eventId), status: 'REGISTERED' },
      ])
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      onRegisterSuccess?.()
    } catch (err: any) {
      console.error('Registration failed:', err)
      const code = getApiErrorCode(err)
      const rawMsg = (err?.response?.data?.message || '').toString().toLowerCase()

      if (code === 'USER.001' || rawMsg.includes('student profile')) {
        useAuthStore.getState().updateUser({ isProfileComplete: false })
        setShowProfilePrompt(true)
        return
      }

      if (code === 'EVENT.006' || rawMsg.includes('had registered') || rawMsg.includes('already registered')) {
        setIsRegistered(true)
      }

      const serverMsg = resolveApiErrorMessage(
        err,
        'Đã có lỗi xảy ra trong quá trình đăng ký sự kiện. Vui lòng thử lại sau hoặc liên hệ Ban tổ chức.'
      )

      setErrorModal({
        isOpen: true,
        message: serverMsg,
        requiresProfile: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel registration action
  const handleCancelRegistration = async () => {
    if (!canCancelRegistration({ status: registrationStatus, dateClose })) {
      setShowCancelConfirm(false)
      return
    }
    setIsLoading(true)
    setShowCancelConfirm(false)
    setIsOpen(false)

    try {
      await apiClient.patch(`/registrations/me/events/${eventId}/cancel`, {
        reason: 'Hủy đăng ký từ giao diện',
      })
      setIsRegistered(false)
      queryClient.setQueryData(['registrations', 'me', isAuthenticated], (old: any[] = []) =>
        old.filter((r: any) => String(r.eventId || r.id) !== String(eventId))
      )
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      onCancelSuccess?.()
    } catch (err: any) {
      console.error('Cancel registration failed:', err)
      setErrorModal({
        isOpen: true,
        message: resolveApiErrorMessage(
          err,
          'Không thể hủy đăng ký sự kiện. Vui lòng thử lại sau!'
        ),
        requiresProfile: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Main button click dispatcher
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isLoading) return

    if (isRegistered) {
      if (onRegisteredClick) {
        onRegisteredClick()
        return
      }
      // Toggle dropdown overlay (always allowed for registered users)
      setIsOpen((prev) => !prev)
    } else if (!disabled) {
      handleRegister()
    }
  }

  // Sizing styles
  const sizeClasses = {
    sm: 'h-11 md:h-7 px-2.5 text-xs whitespace-nowrap',
    md: 'h-11 md:h-8 px-3 text-xs whitespace-nowrap',
    lg: 'h-11 md:h-10 px-4 text-sm font-semibold whitespace-nowrap',
  }[size]
  const actionLabel = isLoading
    ? 'Đang xử lý'
    : isRegistered
      ? label ||
        (registrationStatus === 'COMPLETED'
          ? 'Đã hoàn thành'
          : registrationStatus === 'CHECKED_IN'
            ? 'Đang tham gia'
            : 'Đã đăng ký')
      : disabled
        ? disabledReason === 'closed'
          ? 'Đã đóng đăng ký'
          : disabledReason === 'full'
            ? 'Đã đủ chỗ'
            : 'Không thể đăng ký'
        : label || 'Đăng ký ngay'

  return (
    <div className="relative inline-block text-left select-none">
      {/* 1. Main Button */}
      <Button
        variant="ghost"
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading || (!isRegistered && disabled)}
        aria-label={actionLabel}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold font-heading transition-all duration-150 shadow-2xs whitespace-nowrap focus:outline-none ${sizeClasses} ${
          isLoading
            ? 'bg-[#72A8DE] hover:bg-[#72A8DE] text-white cursor-wait'
            : isRegistered
              ? registrationStatus === 'COMPLETED'
                ? 'bg-emerald-600 hover:bg-emerald-600 active:bg-emerald-600 text-white hover:text-white cursor-pointer shadow-xs focus:ring-2 focus:ring-emerald-500/40'
                : 'bg-[#16A34A] hover:bg-[#16A34A] active:bg-[#16A34A] text-white hover:text-white cursor-pointer shadow-xs focus:ring-2 focus:ring-[#16A34A]/40'
              : disabled
                ? 'bg-[#F3F4F6] dark:bg-muted text-[#6B7280] dark:text-muted-foreground border border-[#E5E7EB] dark:border-border cursor-not-allowed shadow-none'
                : 'bg-[#1F5CA9] hover:bg-[#1B4B8A] active:bg-[#1B406F] text-white cursor-pointer focus:ring-2 focus:ring-[#00AFF0]'
        } ${className}`}
      >
        {compact && !isLoading && !isRegistered && <CalendarCheck className="h-5 w-5 shrink-0" />}
        {isLoading ? (
          <>
            <Loader2
              className={`h-3.5 w-3.5 animate-spin shrink-0 ${compact ? 'text-primary' : 'text-white'}`}
            />
            <span>Đang xử lý</span>
          </>
        ) : isRegistered ? (
          <>
            <span>
              {label ||
                (registrationStatus === 'COMPLETED'
                  ? compact
                    ? 'Hoàn tất'
                    : 'Đã hoàn thành'
                  : registrationStatus === 'CHECKED_IN'
                    ? compact
                      ? 'Tham gia'
                      : 'Đang tham gia'
                    : 'Đã đăng ký')}
            </span>
            {!onRegisteredClick &&
              (isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              ))}
          </>
        ) : disabled ? (
          <span>
            {disabledReason === 'closed'
              ? compact
                ? 'Đã đóng'
                : 'Đã đóng đăng ký'
              : disabledReason === 'full'
                ? compact
                  ? 'Đủ chỗ'
                  : 'Đã đủ chỗ'
                : compact
                  ? 'Tạm khóa'
                  : 'Không thể đăng ký'}
          </span>
        ) : (
          <span>{label || (compact ? 'Đăng ký' : 'Đăng ký ngay')}</span>
        )}
      </Button>

      {/* 2. Overlay Dropdown Menu (Figma Node 910:4855) - Rendered via Portal to avoid overflow clipping */}
      {isOpen &&
        isRegistered &&
        dropdownStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={dropdownStyle}
            className="min-w-[150px] w-max bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg shadow-md py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Item 1: Xem lịch sử tham gia */}
            <Button
              variant="ghost"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                navigate('/history')
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#374151] dark:text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
            >
              <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>Xem lịch sử tham gia</span>
            </Button>

            {/* Chỉ cho phép Hủy đăng ký nếu sự kiện CHƯA điểm danh và CHƯA hoàn thành */}
            {canCancel && (
              <>
                <div className="h-[1px] bg-[#E5E7EB] dark:bg-border my-0.5" />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                    setShowCancelConfirm(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C7212B] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                >
                  <Ban className="h-3.5 w-3.5 text-[#C7212B] dark:text-red-400 shrink-0" />
                  <span>Hủy đăng ký</span>
                </Button>
              </>
            )}
          </div>,
          document.body
        )}

      {/* 3. Modal xác nhận hủy đăng ký */}
      {showCancelConfirm && canCancel &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowCancelConfirm(false)}
          >
            <div
              className="bg-card text-card-foreground border border-border w-full max-w-sm rounded-xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1.5 text-left">
                <h3 className="font-bold text-base text-foreground font-heading">
                  Xác nhận hủy đăng ký?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện{' '}
                  {eventTitle ? `"${eventTitle}"` : 'này'} không? Sau khi hủy, bạn có thể phải chờ
                  đăng ký lại nếu sự kiện còn chỉ tiêu.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  Giữ đăng ký
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleCancelRegistration}
                  className="px-4 py-1.5 bg-[#C7212B] hover:bg-[#a81c25] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Xác nhận hủy
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 4. Modal popup thông báo thất bại */}
      {errorModal.isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setErrorModal({ isOpen: false, message: '' })}
          >
            <div
              className="bg-card text-card-foreground border border-border w-full max-w-sm rounded-xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 select-text"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    Đăng ký không thành công
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {errorModal.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                {errorModal.requiresProfile && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setErrorModal({ isOpen: false, message: '' })
                      navigate(
                        `/onboarding/student?redirect=${encodeURIComponent(window.location.pathname)}`
                      )
                    }}
                    className="px-4 py-1.5 bg-[#1F5CA9] hover:bg-[#1B4B8A] text-white text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Cập nhật thông tin ngay
                  </Button>
                )}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setErrorModal({ isOpen: false, message: '' })}
                  className="px-4 py-1.5 border border-border hover:bg-muted text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                >
                  Đã hiểu
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. Modal yêu cầu hoàn thiện thông tin sinh viên trước khi đăng ký sự kiện */}
      {showProfilePrompt &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowProfilePrompt(false)}
          >
            <div
              className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center shrink-0">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 text-left flex-1">
                  <h3 className="font-bold text-lg text-foreground font-heading">
                    Yêu cầu thông tin sinh viên
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Để đăng ký tham gia sự kiện và được ghi nhận điểm rèn luyện, bạn cần cập nhật
                    thông tin cá nhân (MSSV, lớp, ngành học).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowProfilePrompt(false)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  Để sau
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setShowProfilePrompt(false)
                    navigate(
                      `/onboarding/student?redirect=${encodeURIComponent(window.location.pathname)}`
                    )
                  }}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Cập nhật ngay
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
