import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { getGoogleAuthConfig } from '@/shared/utils/env'

interface GoogleAuthButtonProps {
  text: 'Tiếp tục với Google' | 'Đăng ký bằng Google'
  onSuccess: (credentialResponse: { credential?: string }) => void
  onError?: () => void
  disabled?: boolean
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const googleAuth = getGoogleAuthConfig()

  const handleMockClick = () => {
    if (disabled) return
    onSuccess({ credential: 'mock-google-token-' + Date.now() })
  }

  if (googleAuth.mode === 'ready') {
    return (
      <div className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          text={text === 'Đăng ký bằng Google' ? 'signup_with' : 'continue_with'}
          theme="outline"
          size="large"
          width="400"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={googleAuth.mode === 'mock' ? handleMockClick : undefined}
        disabled={disabled || googleAuth.mode === 'unavailable'}
        className="w-full h-11 rounded-lg border border-[#D1D5DB] dark:border-border bg-white dark:bg-card hover:bg-[#F9FAFB] dark:hover:bg-muted/80 text-foreground font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
      >
        <svg width="20" height="20" className="w-5 h-5 shrink-0 block" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{text}</span>
      </button>
      {googleAuth.mode === 'unavailable' && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          Chưa cấu hình Google: thiếu VITE_GOOGLE_CLIENT_ID trong .env.local. Vui lòng liên hệ quản trị viên.
        </p>
      )}
    </div>
  )
}
