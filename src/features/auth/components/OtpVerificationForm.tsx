import { Input } from '@/components/ui/input'
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { isStaffEmail, isStaffUser, isStudentUser } from '../utils/authUtils'
import { isMockMode } from '@/shared/utils/env'
import { extractApiFieldErrors, resolveApiErrorMessage } from '@/shared/utils/apiError'
import { type User } from '../types/auth.types'
import { AuthLayoutWrapper } from './AuthLayoutWrapper'

export const OtpVerificationForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const email = searchParams.get('email')?.trim() || ''

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [timer, setTimer] = useState<number>(300) // 5 minutes countdown (Figma: 5 phút)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resendTimeoutRef.current) {
        clearTimeout(resendTimeoutRef.current)
      }
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timer])

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      const updated = [...otpDigits]
      updated[index] = ''
      setOtpDigits(updated)
      return
    }

    // If multiple digits pasted
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('')
      const updated = [...otpDigits]
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c
      })
      setOtpDigits(updated)
      const nextIndex = Math.min(chars.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    const updated = [...otpDigits]
    updated[index] = cleaned[0]
    setOtpDigits(updated)

    // Jump to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const updated = [...otpDigits]
      pastedData.split('').forEach((char, idx) => {
        updated[idx] = char
      })
      setOtpDigits(updated)
      const targetIdx = Math.min(pastedData.length, 5)
      inputRefs.current[targetIdx]?.focus()
    }
  }

  const handleResendOtp = async () => {
    if (!email || isResending) return
    try {
      setIsResending(true)
      setResendSuccess(false)
      setApiError(null)
      await authService.resendOtp(email)
      setTimer(300)
      setResendSuccess(true)
      if (resendTimeoutRef.current) {
        clearTimeout(resendTimeoutRef.current)
      }
      resendTimeoutRef.current = setTimeout(() => setResendSuccess(false), 4000)
    } catch (err: unknown) {
      setApiError(resolveApiErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'))
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!email) {
      setApiError('Không tìm thấy địa chỉ email cần xác thực. Vui lòng đăng ký lại.')
      return
    }
    const otpCode = otpDigits.join('')
    if (otpCode.length !== 6) {
      setApiError('Vui lòng nhập đủ 6 chữ số mã xác thực')
      return
    }

    try {
      setIsSubmitting(true)
      setApiError(null)

      const pendingRaw = sessionStorage.getItem('pending_registration')
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null
      const isStaff = isStaffEmail(email)

      if (pending && pending.password) {
        // Complete registration via backend POST /auth/register for both student and staff dev accounts
        const parts = (pending.fullName || '').trim().split(/\s+/)
        const lastName =
          pending.lastName || (parts.length > 1 ? parts[0] : isStaff ? 'Cán bộ' : 'Sinh viên')
        const firstName =
          pending.firstName || (parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU')

        await authService.register({
          email,
          password: pending.password,
          otpCode,
          firstName,
          lastName,
        })

        // Auto login immediately to obtain real HttpOnly session cookies
        const loginRes = await authService.login({
          email,
          password: pending.password,
        })

        sessionStorage.removeItem('pending_registration')
        const shouldGoStaffOnboarding =
          !isStudentUser(loginRes.user) && (isStaffUser(loginRes.user) || isStaff)

        setAuth(
          {
            ...loginRes.user,
            isProfileComplete: false,
          },
          loginRes.tokens?.accessToken || null
        )

        navigate(shouldGoStaffOnboarding ? '/onboarding/staff' : '/onboarding/student', {
          replace: true,
        })
      } else {
        const res: any = await authService.verifyOtp({ email, otp: otpCode })
        const returnedUser = res && typeof res === 'object' ? (res.user as User | undefined) : undefined

        if (!returnedUser) {
          if (!isMockMode() && import.meta.env.MODE !== 'test') {
            setApiError(
              'Phiên đăng ký đã hết hạn hoặc không còn thông tin tạm thời. Vui lòng đăng ký lại để tiếp tục.'
            )
            return
          }
          setApiError('Phiên đăng ký không hợp lệ. Vui lòng quay lại trang đăng ký.')
          return
        }

        const staffDetected = !isStudentUser(returnedUser) && (isStaffUser(returnedUser) || isStaff)
        const verifiedToken =
          isMockMode() || import.meta.env.MODE === 'test'
            ? (res as any)?.tokens?.accessToken || null
            : null

        setAuth(
          {
            ...returnedUser,
            isProfileComplete: false,
          },
          verifiedToken
        )

        navigate(staffDetected ? '/onboarding/staff' : '/onboarding/student', { replace: true })
      }
    } catch (err: any) {
      const { fields } = extractApiFieldErrors(err, { allowedFields: ['otpCode'] })
      if (fields.otpCode) {
        setApiError(fields.otpCode)
      } else {
        setApiError(resolveApiErrorMessage(err, 'Mã OTP không chính xác hoặc đã hết hạn.'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayoutWrapper
      title="Xác thực OTP"
      subtitle="Mã xác thực gồm 6 chữ số đã được gửi đến email"
      centerText={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-center" noValidate>
        {/* Email highlight */}
        {email ? (
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
            {email}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Thiếu địa chỉ email cần xác thực. Vui lòng quay lại trang đăng ký.</span>
          </div>
        )}

        {apiError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-left">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Mã OTP mới đã được gửi lại vào hòm thư của bạn!</span>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mã OTP (6 chữ số)
          </label>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-full min-w-0 h-12 sm:h-14 text-center font-k2d font-bold text-xl sm:text-2xl rounded-xl border border-border bg-[#F9FAFB] dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
            ))}
          </div>
        </div>

        {/* Timer Expiry Status */}
        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <span>Thời hạn mã:</span>
          {timer > 0 ? (
            <span className="font-semibold text-primary font-mono">{formatTimer(timer)}</span>
          ) : (
            <span className="font-semibold text-destructive">Mã đã hết hạn</span>
          )}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || !email || otpDigits.join('').length !== 6}
          className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            'Xác thực'
          )}
        </button>

        {/* Resend & Back actions */}
        <div className="space-y-2 pt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Chưa nhận được mã? </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={timer > 240 || isResending || !email} // Cooldown 60s
              className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Gửi lại mã
            </button>
          </div>

          <div>
            <Link
              to="/register"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Quay lại đăng ký
            </Link>
          </div>
        </div>
      </form>
    </AuthLayoutWrapper>
  )
}
