import { useState, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getApiErrorCode, resolveApiErrorMessage } from '@/shared/utils/apiError'
import { Loader2, RefreshCw } from 'lucide-react'

export function PasswordSettings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: security,
    isLoading: isSecurityLoading,
    isError: isSecurityError,
    refetch: refetchSecurity,
  } = useQuery({
    queryKey: ['account-security'],
    queryFn: async () => {
      if (typeof authService.getAccountSecurity === 'function') {
        return authService.getAccountSecurity()
      }
      return null
    },
    staleTime: 60_000,
  })

  const [mode, setMode] = useState<'create' | 'change' | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (security && mode === null) {
      setMode(security.hasPassword ? 'change' : 'create')
    }
  }, [security, mode])

  const reset = (next: typeof mode) => {
    setMode(next)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !mode) return
    setError('')
    setSuccess('')
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'create') {
        await authService.createPassword(newPassword)
        await queryClient.invalidateQueries({ queryKey: ['account-security'] })
        reset(null)
        setSuccess('Đã cập nhật mật khẩu. Bạn có thể đăng nhập bằng email và mật khẩu này.')
      } else {
        await authService.changePassword(oldPassword, newPassword)
        // BE revokes every refresh session on password change and does not issue a replacement.
        await authService.logout().catch(() => undefined)
        useAuthStore.getState().clearAuth()
        queryClient.clear()
        navigate('/login?passwordChanged=1', { replace: true })
        return
      }
    } catch (err) {
      const code = getApiErrorCode(err)
      const rawMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
      if (
        code === 'PASSWORD_ALREADY_SET' ||
        /already has a password|change-password/i.test(rawMessage)
      ) {
        await queryClient.invalidateQueries({ queryKey: ['account-security'] })
        reset('change')
        setError('Tài khoản đã có mật khẩu. Vui lòng dùng chức năng đổi mật khẩu.')
      } else {
        setError(resolveApiErrorMessage(err, 'Không cập nhật được mật khẩu. Vui lòng thử lại.'))
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 sm:p-6"
      aria-label="Bảo mật tài khoản"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-k2d text-lg font-semibold">Bảo mật tài khoản</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isSecurityLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Đang kiểm tra...</span>
            </div>
          )}

          {isSecurityError && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">Lỗi tải trạng thái</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refetchSecurity()}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Thử lại
              </Button>
            </div>
          )}

          {/* If security not resolved yet or hasPassword is false -> show Create */}
          {(!security || security.hasPassword === false) && (
            <Button
              variant={mode === 'create' ? 'secondary' : 'outline'}
              disabled={busy}
              onClick={() => reset('create')}
            >
              Tạo mật khẩu lần đầu
            </Button>
          )}

          {/* If security not resolved yet or hasPassword is true -> show Change */}
          {(!security || security.hasPassword === true) && (
            <Button
              variant={mode === 'change' ? 'secondary' : 'outline'}
              disabled={busy}
              onClick={() => reset('change')}
            >
              Đổi mật khẩu
            </Button>
          )}
        </div>
      </div>
      {mode && (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'create'
              ? 'Dành cho tài khoản đăng nhập bằng Google chưa từng tạo mật khẩu.'
              : 'Nhập mật khẩu hiện tại và mật khẩu mới.'}
          </p>
          <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            {mode === 'change' && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="account-old-password">Mật khẩu hiện tại</Label>
                <Input
                  id="account-old-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-new-password">Mật khẩu mới</Label>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="account-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => reset(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </p>
      )}
    </section>
  )
}
