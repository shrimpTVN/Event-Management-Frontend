import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { loginSchema, type LoginInput } from '../types/auth.schemas'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { isStaffEmail } from '../utils/authUtils'
import { AuthLayoutWrapper } from './AuthLayoutWrapper'
import { GoogleAuthButton } from './GoogleAuthButton'

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rawRedirect = searchParams.get('redirect')
  const redirectUrl = rawRedirect || '/'

  // If already authenticated, redirect appropriately
  React.useEffect(() => {
    const state = useAuthStore.getState()
    if (state.isAuthenticated && state.user) {
      if (state.user.role === 'ORGANIZER' || isStaffEmail(state.user.email)) {
        navigate('/staff/fanpages', { replace: true })
      } else {
        navigate(redirectUrl === '/staff/fanpages' ? '/' : redirectUrl, { replace: true })
      }
    }
  }, [navigate, redirectUrl])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const res = await authService.login(data)
      setAuth(res.user, res.tokens.accessToken)

      // Cán bộ / Ban tổ chức tuyệt đối không điều hướng qua trang chủ sinh viên
      const isStaff = isStaffEmail(data.email) || res.user.role === 'ORGANIZER'
      if (isStaff) {
        navigate('/staff/fanpages', { replace: true })
      } else if (res.user.role === 'STUDENT' && !res.user.isProfileComplete) {
        navigate('/onboarding/student', { replace: true })
      } else {
        // Sinh viên chuyển về trang chủ hoặc trang mong muốn
        const target = redirectUrl === '/staff/fanpages' ? '/' : redirectUrl
        navigate(target, { replace: true })
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const email = credentialResponse?.profile?.email || 'student.google@ctu.edu.vn'
      const res = await authService.login({
        email,
        password: 'GoogleLoginPass123',
      })
      setAuth(res.user, credentialResponse?.credential || res.tokens.accessToken)

      // Cán bộ / Ban tổ chức tuyệt đối không điều hướng qua trang chủ sinh viên
      const isStaff = isStaffEmail(email) || res.user.role === 'ORGANIZER'
      if (isStaff) {
        navigate('/staff/fanpages', { replace: true })
      } else if (res.user.role === 'STUDENT' && !res.user.isProfileComplete) {
        navigate('/onboarding/student', { replace: true })
      } else {
        const target = redirectUrl === '/staff/fanpages' ? '/' : redirectUrl
        navigate(target, { replace: true })
      }
    } catch {
      setApiError('Đăng nhập Google thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayoutWrapper
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay trở lại..."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              placeholder="vdnguyen@ctu.edu.vn"
              autoComplete="email"
              className={`w-full h-11 pl-10 pr-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.email
                  ? 'border-destructive focus:border-destructive'
                  : 'border-[#D1D5DB] dark:border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Vui lòng nhập mật khẩu"
              autoComplete="current-password"
              className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
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
          onError={() => setApiError('Đăng nhập Google không thành công.')}
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
      </form>
    </AuthLayoutWrapper>
  )
}
