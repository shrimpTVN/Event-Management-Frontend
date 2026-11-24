import { Input } from '@/components/ui/input'
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { isStaffEmail, isStaffUser } from '../utils/authUtils'
import { RoleEnum, type User } from '../types/auth.types'
import { AuthLayoutWrapper } from './AuthLayoutWrapper'

export const OtpVerificationForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const email = searchParams.get('email') || 'user@student.ctu.edu.vn'

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [timer, setTimer] = useState<number>(300) // 5 minutes countdown (Figma: 5 phút)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
    try {
      setResendSuccess(false)
      setApiError(null)
      await authService.resendOtp(email)
      setTimer(300)
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 4000)
    } catch {
      setApiError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      if (pending && pending.password && !isStaff) {
        // Complete student registration via backend POST /auth/register
        const parts = (pending.fullName || '').trim().split(/\s+/)
        const lastName = pending.lastName || (parts.length > 1 ? parts[0] : 'Sinh viên')
        const firstName =
          pending.firstName || (parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU')

        await authService.register({
          email,
          password: pending.password,
          otpCode,
          firstName,
          lastName,
        })

        // Auto login immediately
        const loginRes = await authService.login({
          email,
          password: pending.password,
        })

        sessionStorage.removeItem('pending_registration')
        setAuth(
          {
            ...loginRes.user,
            isProfileComplete: false,
          },
          loginRes.tokens?.accessToken || null
        )

        navigate('/onboarding/student', { replace: true })
      } else {
        const res: any = await authService.verifyOtp({ email, otp: otpCode })

        const emailUsername = email.split('@')[0] || ''
        const staffDetected = isStaffUser(res?.user) || isStaff
        const newUserId = Date.now()
        const defaultUser: User = res?.user || {
          id: 'usr-' + newUserId,
          email,
          name:
            emailUsername.replace(/[._]/g, ' ') || (staffDetected ? 'Cán bộ CTU' : 'Sinh viên CTU'),
          studentId: !staffDetected ? emailUsername.toUpperCase() : undefined,
          role: staffDetected ? RoleEnum.FANPAGE_ADMIN : RoleEnum.STUDENT,
          createdAt: new Date().toISOString(),
          isProfileComplete: false,
        }

        const verifiedToken =
          (res as any)?.tokens?.accessToken || `mock-jwt-token-${newUserId}-${Date.now()}`

        setAuth(
          {
            ...defaultUser,
            role: staffDetected ? RoleEnum.FANPAGE_ADMIN : RoleEnum.STUDENT,
            isProfileComplete: false,
          },
          verifiedToken
        )

        if (staffDetected) {
          // Staff phải yêu cầu nhập thông tin cán bộ trước, rồi mới sang trang quản lý fanpage
          navigate('/onboarding/staff', { replace: true })
        } else {
          // Sinh viên yêu cầu hoàn tất thông tin sinh viên ngay sau khi xác thực OTP
          navigate('/onboarding/student', { replace: true })
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || ''
      if (typeof msg === 'string' && (msg.includes("can't be blank") || msg.includes('otpCode'))) {
        setApiError('Mã OTP không được để trống.')
      } else if (
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('expired') ||
          msg.toLowerCase().includes('wrong') ||
          msg.toLowerCase().includes('used'))
      ) {
        setApiError('Mã OTP không chính xác hoặc đã hết hạn.')
      } else {
        setApiError(msg || 'Mã OTP không chính xác hoặc đã hết hạn.')
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
        <div className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
          {email}
        </div>

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
          disabled={isSubmitting || otpDigits.join('').length !== 6}
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
              disabled={timer > 240} // Cooldown 60s
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
