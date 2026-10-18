import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { registerSchema, type RegisterInput } from '../types/auth.schemas'
import { authService } from '../services/authService'
import { AuthLayoutWrapper } from './AuthLayoutWrapper'
import { GoogleAuthButton } from './GoogleAuthButton'

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      await authService.register({
        email: data.email,
        password: data.password,
      })
      // Direct user to OTP Verification Step (Figma 968:5594)
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async () => {
    try {
      setIsSubmitting(true)
      navigate('/onboarding/student')
    } catch {
      setApiError('Đăng ký bằng Google không thành công.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayoutWrapper
      title="Đăng kí"
      subtitle="Vui lòng đăng kí bằng email của trường để tiếp tục"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {apiError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* School Email Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">
            Email trường
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              placeholder="Tên đăng nhập@ctu.edu.vn"
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
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
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

        {/* Confirm Password Field */}
        <div className="space-y-1.5 text-left">
          <label className="block text-sm font-medium text-foreground">
            Nhập lại mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                errors.confirmPassword
                  ? 'border-destructive focus:border-destructive'
                  : 'border-[#D1D5DB] dark:border-border focus:border-primary'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Full-width Register Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý đăng ký...</span>
            </>
          ) : (
            'Đăng ký'
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

        {/* Full-width Register with Google Button */}
        <GoogleAuthButton
          text="Đăng ký bằng Google"
          onSuccess={handleGoogleSuccess}
          onError={() => setApiError('Đăng ký bằng Google không thành công.')}
          disabled={isSubmitting}
        />

        {/* Switch Link: Đã có tài khoản? Đăng nhập */}
        <div className="pt-2 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            Đăng nhập
          </Link>
        </div>
      </form>
    </AuthLayoutWrapper>
  )
}
