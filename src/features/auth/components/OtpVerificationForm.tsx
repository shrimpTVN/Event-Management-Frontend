import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { isStaffEmail, isStaffUser } from '../utils/authUtils'
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
      const res = await authService.verifyOtp({ email, otp: otpCode })
      setAuth(res.user, 'mock-jwt-token-verified')

      // Route to profile setup
      if (isStaffUser(res.user) || isStaffEmail(email)) {
        navigate('/onboarding/staff')
      } else {
        navigate('/onboarding/student')
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const maskedEmail = () => {
    const parts = email.split('@')
    if (parts.length < 2) return email
    const name = parts[0]
    const maskedName = name.length > 2 ? `${name[0]}******${name[name.length - 1]}` : `${name}***`
    return `${maskedName}@${parts[1]}`
  }

  return (
    <AuthLayoutWrapper
      title="Xác thực OTP"
      subtitle="Mã xác thực gồm 6 chữ số đã được gửi đến email"
      centerText={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-center" noValidate>
        {/* Masked Email highlight */}
        <div className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
          {maskedEmail()}
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
          <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
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
                className="w-11 h-13 sm:w-13 sm:h-14 text-center font-k2d font-bold text-xl sm:text-2xl rounded-xl border border-border bg-[#F9FAFB] dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
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
