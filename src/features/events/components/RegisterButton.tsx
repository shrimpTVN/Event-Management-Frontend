import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronDown, ChevronUp, AlertCircle, CalendarCheck, Ban } from 'lucide-react'
import { apiClient } from '@/shared'
import { useQueryClient } from '@tanstack/react-query'

export interface RegisterButtonProps {
  eventId: string | number
  eventTitle?: string
  isRegistered?: boolean
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
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
  isRegistered: initialRegistered = false,
  disabled = false,
  className = '',
  size = 'md',
  onRegisterSuccess,
  onCancelSuccess,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isRegistered, setIsRegistered] = useState(initialRegistered)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    message: string
  }>({
    isOpen: false,
    message: '',
  })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync prop changes
  useEffect(() => {
    setIsRegistered(initialRegistered)
  }, [initialRegistered])

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
    setIsLoading(true)

    try {
      // Small minimum processing threshold (e.g. 500ms) so user can see "Đang xử lý" smoothly
      const minDelay = new Promise((resolve) => setTimeout(resolve, 500))

      const request = (async () => {
        try {
          return await apiClient.post(`/events/${eventId}/register`)
        } catch {
          return await apiClient.post('/registrations', { eventId: Number(eventId) })
        }
      })()

      await Promise.all([request, minDelay])

      setIsRegistered(true)
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      onRegisterSuccess?.()
    } catch (err: any) {
      console.error('Registration failed:', err)
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Đã có lỗi xảy ra trong quá trình đăng ký sự kiện. Vui lòng thử lại sau hoặc liên hệ Ban tổ chức.'
      setErrorModal({
        isOpen: true,
        message: serverMsg,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel registration action
  const handleCancelRegistration = async () => {
    setIsLoading(true)
    setShowCancelConfirm(false)
    setIsOpen(false)

    try {
      await apiClient.patch(`/registrations/me/events/${eventId}/cancel`, {
        reason: 'Hủy đăng ký từ giao diện',
      })
      setIsRegistered(false)
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      onCancelSuccess?.()
    } catch (err) {
      console.error('Cancel registration failed:', err)
      // Optimistic fallback for prototype
      setIsRegistered(false)
      onCancelSuccess?.()
    } finally {
      setIsLoading(false)
    }
  }

  // Main button click dispatcher
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (disabled || isLoading) return

    if (isRegistered) {
      // Toggle dropdown overlay
      setIsOpen((prev) => !prev)
    } else {
      handleRegister()
    }
  }

  // Sizing styles
  const sizeClasses = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-8 px-4 text-xs sm:text-sm',
    lg: 'h-9 sm:h-10 px-5 text-sm font-semibold',
  }[size]

  return (
    <div className="relative inline-block text-left select-none">
      {/* 1. Main Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold font-heading transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none ${sizeClasses} ${
          disabled
            ? 'bg-[#E5E7EB] dark:bg-muted text-[#9CA3AF] cursor-not-allowed shadow-none'
            : isLoading
            ? 'bg-[#72A8DE] hover:bg-[#72A8DE] text-white cursor-wait'
            : isRegistered
            ? 'bg-[#16834A] hover:bg-[#137240] active:bg-[#0f5c33] text-white focus:ring-2 focus:ring-[#16834A]/40'
            : 'bg-[#1F5CA9] hover:bg-[#1B4B8A] active:bg-[#1B406F] text-white focus:ring-2 focus:ring-[#00AFF0]'
        } ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-white" />
            <span>Đang xử lý</span>
          </>
        ) : isRegistered ? (
          <>
            <span>Đã đăng ký</span>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            )}
          </>
        ) : (
          <span>Đăng ký ngay</span>
        )}
      </button>

      {/* 2. Overlay Dropdown Menu (Figma Node 910:4855) - Rendered via Portal to avoid overflow clipping */}
      {isOpen &&
        isRegistered &&
        dropdownStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={dropdownStyle}
            className="min-w-[155px] w-max bg-white dark:bg-card border border-[#D1D5DB] dark:border-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.15)] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Item 1: Quản lý sự kiện */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                navigate('/history')
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#374151] dark:text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
            >
              <CalendarCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Quản lý sự kiện</span>
            </button>

            {/* Divider line matching Figma */}
            <div className="h-[1px] bg-[#E5E7EB] dark:bg-border my-0.5" />

            {/* Item 2: Hủy đăng ký */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                setShowCancelConfirm(true)
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#C7212B] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
            >
              <Ban className="h-4 w-4 text-[#C7212B] dark:text-red-400 shrink-0" />
              <span>Hủy đăng ký</span>
            </button>
          </div>,
          document.body
        )}

      {/* 3. Modal xác nhận hủy đăng ký */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-card text-card-foreground border border-border w-full max-w-sm rounded-xl p-5 shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5 text-left">
              <h3 className="font-bold text-base text-foreground font-heading">
                Xác nhận hủy đăng ký?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện {eventTitle ? `"${eventTitle}"` : 'này'} không? Sau khi hủy, bạn có thể phải chờ đăng ký lại nếu sự kiện còn chỉ tiêu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                Giữ đăng ký
              </button>
              <button
                type="button"
                onClick={handleCancelRegistration}
                className="px-4 py-1.5 bg-[#C7212B] hover:bg-[#a81c25] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
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

              <div className="flex items-center justify-end pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setErrorModal({ isOpen: false, message: '' })}
                  className="px-4 py-1.5 bg-[#1F5CA9] hover:bg-[#1B4B8A] text-white text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
