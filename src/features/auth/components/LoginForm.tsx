import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { loginSchema, type LoginInput } from '../types/auth.schemas'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { getLoginDestination } from '../utils/authUtils'
import { isMockMode } from '@/shared/utils/env'
import {
  extractApiFieldErrors,
  getApiErrorCode,
  resolveApiErrorMessage,
} from '@/shared/utils/apiError'
import { AuthLayoutWrapper } from './AuthLayoutWrapper'
import { GoogleAuthButton } from './GoogleAuthButton'

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rawRedirect = searchParams.get('redirect')
  const redirectUrl = rawRedirect || '/'

  // If already authenticated, redirect appropriately
  React.useEffect(() => {
    const state = useAuthStore.getState()
    if (state.isAuthenticated && state.user) {
      navigate(getLoginDestination(state.user, redirectUrl), { replace: true })
    }
  }, [navigate, redirectUrl])

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    if (isSubmitting) return
    const rawEmail = data.email.trim()
    let normalizedEmail = rawEmail
    if (rawEmail.toLowerCase() === 'admin') {
      normalizedEmail = 'admin@ctu.edu.vn'
    } else if (rawEmail.toLowerCase() === 'superadmin') {
      normalizedEmail = 'superadmin@gmail.com'
    }

    try {
      setIsSubmitting(true)
      setApiError(null)
      clearErrors()
      const res = await authService.login({
        ...data,
        email: normalizedEmail,
      })

      // Xóa toàn bộ query cache từ tài khoản trước đó để tránh xung đột dữ liệu
      queryClient.clear()
      setAuth(res.user, res.tokens?.accessToken || null)

      navigate(getLoginDestination(res.user, redirectUrl), { replace: true })
    } catch (err: any) {
      const code = getApiErrorCode(err)
      const isInvalidCredentials =
        ['AUTH.005', 'AUTH.001', 'AUTH.010', 'AUTH_USER_NOT_FOUND', 'AUTH_INVALID_CREDENTIALS'].includes(code || '') ||
        err.response?.status === 401 ||
        (err.response?.status === 400 && code !== '000' && code !== 'VALIDATION_ERROR')

      if (isInvalidCredentials) {
        setApiError('Email hoặc mật khẩu không đúng.')
      } else if (code === '000' || code === 'VALIDATION_ERROR') {
        const { fields } = extractApiFieldErrors(err, { allowedFields: ['email', 'password'] })
        if (Object.keys(fields).length > 0) {
          Object.entries(fields).forEach(([field, message]) => {
            setError(field as 'email' | 'password', { type: 'manual', message })
          })
        } else {
          setApiError('Thông tin đăng nhập chưa hợp lệ. Vui lòng kiểm tra lại.')
        }
      } else {
        if (import.meta.env.DEV) console.error('Login request failed:', err)
        setApiError(
          resolveApiErrorMessage(err, 'Hệ thống đang bận hoặc mất kết nối mạng. Vui lòng thử lại sau.')
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      setApiError(null)
      clearErrors()
      const idToken = credentialResponse?.credential
      if (!idToken || (!isMockMode() && idToken.startsWith('mock-google-token-'))) {
        setApiError('Không nhận được thông tin xác thực từ Google. Vui lòng thử lại.')
        return
      }
      const res = await authService.exchangeGoogleToken({ idToken })

      queryClient.clear()
      setAuth(res.user, res.tokens?.accessToken || null)

      navigate(getLoginDestination(res.user, redirectUrl), { replace: true })
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Google login exchange error:', err)
      setApiError(resolveApiErrorMessage(err, 'Đăng nhập Google thất bại. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayoutWrapper title="Đăng nhập" subtitle="Chào mừng bạn quay trở lại...">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {searchParams.get('passwordChanged') === '1' && (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
            Đã đổi mật khẩu. Vui lòng đăng nhập lại.
          </p>
        )}
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              {...register('email', {
                onChange: () => {
                  if (errors.email) clearErrors('email')
                  if (apiError) setApiError(null)
                },
              })}
              placeholder="example@student.ctu.edu.vn hoặc @ctu.edu.vn"
              autoComplete="email"
              className={`w-full h-11 pl-10 pr-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.email
                  ? 'border-destructive focus:border-destructive'
                  : 'border-[#D1D5DB] dark:border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                onChange: () => {
                  if (errors.password) clearErrors('password')
                  if (apiError) setApiError(null)
                },
              })}
              placeholder="Vui lòng nhập mật khẩu"
              autoComplete="current-password"
              className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.password
                  ? 'border-destructive focus:border-destructive'
                  : 'border-[#D1D5DB] dark:border-border focus:border-primary'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Full-width Login Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

        {/* Divider: Hoặc */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB] dark:border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-card px-3 text-muted-foreground font-medium">
              Hoặc
            </span>
          </div>
        </div>

        {/* Full-width Continue with Google Button */}
        <GoogleAuthButton
          text="Tiếp tục với Google"
          onSuccess={handleGoogleSuccess}
          onError={() => {
            if (import.meta.env.DEV) console.error('Google Auth SDK failed to complete sign-in')
            setApiError('Đăng nhập Google thất bại. Vui lòng thử lại.')
          }}
          disabled={isSubmitting}
        />

        {/* Switch to Register link */}
        <div className="pt-2 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            Đăng ký
          </Link>
        </div>
    </AuthLayoutWrapper>
  )
}
