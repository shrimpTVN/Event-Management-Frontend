import { PasswordSettings } from '@/features/auth/components/PasswordSettings'
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Loader2,
  Pencil,
  Save,
  UserRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mediaService } from '@/shared/services/mediaService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isStaffUser, normalizeRole } from '@/features/auth/utils/authUtils'
import { profileService, type StudentProfile } from '@/features/profile'
import { fanpageAdminService } from '../services/fanpageAdminService'
import type { FanpageSummary } from '../types/fanpageAdmin.types'

interface FanpageAdminPersonalProfileViewProps {
  currentFanpage?: FanpageSummary
  onBack?: () => void
}

const systemRoleLabels: Record<string, string> = {
  STUDENT: 'Sinh viên',
  FANPAGE_ADMIN: 'Quản trị viên fanpage',
  ADMIN: 'Quản trị viên hệ thống',
}
function ProfileRow({
  label,
  value,
  control,
  id,
}: {
  label: string
  value?: string
  control?: React.ReactNode
  id?: string
}) {
  if (!value?.trim() && !control) return null
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm leading-6 text-muted-foreground">
        {control ? (
          <Label htmlFor={id} className="font-normal leading-6 text-muted-foreground">
            {label}
          </Label>
        ) : (
          label
        )}
      </dt>
      <dd className="m-0 min-w-0 break-words text-sm leading-6 text-foreground">
        {control || value}
      </dd>
    </div>
  )
}

export const FanpageAdminPersonalProfileView: React.FC<FanpageAdminPersonalProfileViewProps> = ({
  currentFanpage,
  onBack,
}) => {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isStaff = Boolean(user && isStaffUser(user))
  const profileKey = ['profile', 'me', user?.id, isStaff ? 'staff' : 'student']
  const {
    data: profile,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: profileKey,
    queryFn: () => (isStaff ? profileService.getMyStaffProfile() : profileService.getMyProfile()),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  })
  const { data: fanpages = [], isPending: loadingFanpages } = useQuery({
    queryKey: ['admin-available-fanpages', user?.id, user?.email],
    queryFn: () => fanpageAdminService.getAvailableFanpages(),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [draft, setDraft] = useState<{
    fullName: string
    gender: StudentProfile['gender']
    avatarUrl: string
    title: string
    dateOfBirth: string
    phoneNumber: string
  }>({ fullName: '', gender: '', avatarUrl: '', title: '', dateOfBirth: '', phoneNumber: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])
  useEffect(() => {
    setIsEditing(false)
    setAvatarFile(null)
    setFeedback(null)
  }, [user?.id])

  const displayName = profile?.fullName || user?.name || 'Tài khoản cá nhân'
  const email = profile?.email || user?.email || ''
  const roles = [
    ...new Set(
      (profile?.roles || user?.roles || (user?.role ? [user.role] : []))
        .map((role) => systemRoleLabels[normalizeRole(role) || ''])
        .filter(Boolean)
    ),
  ].join(' · ')
  const avatarUrl = isEditing
    ? previewUrl || draft.avatarUrl
    : profile?.avatarUrl || user?.avatarUrl
  const canEdit = Boolean(profile && (isStaff || profile.studentId))
  const busy = isSaving || isUploading
  const missingStaffProfile =
    isStaff && (error as { response?: { status?: number } })?.response?.status === 404
  const startEdit = () => {
    if (!profile || !canEdit) return
    setDraft({
      fullName: profile.fullName || user?.name || '',
      gender: profile.gender,
      avatarUrl: profile.avatarUrl || user?.avatarUrl || '',
      title: profile.title || '',
      dateOfBirth: profile.dateOfBirth || '',
      phoneNumber: profile.phoneNumber || '',
    })
    setAvatarFile(null)
    setFeedback(null)
    setIsEditing(true)
  }
  const cancelEdit = () => {
    setIsEditing(false)
    setAvatarFile(null)
    setFeedback(null)
  }
  const selectAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn ảnh PNG, JPG hoặc WEBP, tối đa 5 MB.' })
      return
    }
    setAvatarFile(file)
    setFeedback(null)
    event.target.value = ''
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isEditing || !canEdit || busy) return
    setFeedback(null)
    setIsSaving(true)
    try {
      let uploadedUrl = draft.avatarUrl
      if (avatarFile) {
        setIsUploading(true)
        uploadedUrl = await mediaService.uploadImage(avatarFile, 'AVATAR')
        if (!uploadedUrl) throw new Error('Chưa tải được ảnh đại diện.')
        setDraft((old) => ({ ...old, avatarUrl: uploadedUrl }))
        setAvatarFile(null)
        setIsUploading(false)
      }
      const payload = { ...draft, avatarUrl: uploadedUrl }
      const saved = isStaff
        ? await profileService.updateMyStaffProfile(payload, profile!)
        : await profileService.updateMyProfile(payload)
      queryClient.setQueryData(profileKey, saved)
      useAuthStore.getState().updateUser({ name: saved.fullName, avatarUrl: saved.avatarUrl })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage-members'] })
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Đã lưu thông tin cá nhân.' })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : 'Chưa lưu được thông tin. Vui lòng thử lại.'),
      })
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-left">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-k2d text-2xl font-bold text-foreground">Thông tin cá nhân</h1>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Về fanpage
          </Button>
        )}
      </div>
      {isPending && user?.id && (
        <p role="status" className="text-sm text-muted-foreground">
          Đang tải hồ sơ...
        </p>
      )}
      {missingStaffProfile && (
        <p role="alert" className="text-sm text-muted-foreground">
          Chưa có hồ sơ cán bộ.{' '}
          <Link className="text-primary hover:underline" to="/onboarding/staff">
            Hoàn thiện hồ sơ
          </Link>
        </p>
      )}
      {isError && !missingStaffProfile && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>Chưa tải được đầy đủ hồ sơ cá nhân.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'border-destructive/20 bg-destructive/10 text-destructive'}`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đóng thông báo"
            onClick={() => setFeedback(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form
        onSubmit={save}
        aria-label="Hồ sơ cá nhân"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card sm:p-6"
      >
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserRound className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
              {isEditing && (
                <>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    aria-label="Chọn ảnh đại diện"
                    onChange={selectAvatar}
                    disabled={busy}
                  />
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Đổi ảnh đại diện"
                    title="PNG, JPG, WEBP · Tối đa 5 MB"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-8 w-8 border-2 border-white dark:border-card"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              {isEditing ? (
                <>
                  <Label htmlFor="personal-name" className="sr-only">
                    Họ và tên
                  </Label>
                  <Input
                    id="personal-name"
                    value={draft.fullName}
                    onChange={(e) => setDraft((old) => ({ ...old, fullName: e.target.value }))}
                    required
                    disabled={busy}
                  />
                </>
              ) : (
                <h2 className="break-words font-k2d text-xl font-semibold text-foreground">
                  {displayName}
                </h2>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="break-words text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {email}
                </a>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            {isEditing ? (
              <>
                <Button type="button" variant="ghost" disabled={busy} onClick={cancelEdit}>
                  Hủy
                </Button>
                <Button type="submit" disabled={busy} className="gap-2">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isUploading ? 'Đang tải ảnh...' : isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </>
            ) : (
              canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isFetching}
                  onClick={startEdit}
                  className="gap-2 text-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa thông tin
                </Button>
              )
            )}
          </div>
        </header>
        <dl className="mt-6 flex flex-col gap-5 border-t border-border pt-6">
          <ProfileRow
            id="personal-gender"
            label="Giới tính"
            value={profile?.gender}
            control={
              isEditing ? (
                <Select
                  value={draft.gender}
                  onValueChange={(value) =>
                    setDraft((old) => ({ ...old, gender: value as StudentProfile['gender'] }))
                  }
                  disabled={busy}
                >
                  <SelectTrigger id="personal-gender">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              ) : undefined
            }
          />
          <ProfileRow label="Vai trò hệ thống" value={roles} />
          <ProfileRow
            label="Ngày sinh"
            value={profile?.dateOfBirth}
            control={
              isEditing && isStaff ? (
                <Input
                  aria-label="Ngày sinh"
                  type="date"
                  value={draft.dateOfBirth}
                  onChange={(e) => setDraft((old) => ({ ...old, dateOfBirth: e.target.value }))}
                  disabled={busy}
                />
              ) : undefined
            }
          />
          <ProfileRow
            label="Số điện thoại"
            value={profile?.phoneNumber}
            control={
              isEditing && isStaff ? (
                <Input
                  aria-label="Số điện thoại"
                  maxLength={20}
                  value={draft.phoneNumber}
                  onChange={(e) => setDraft((old) => ({ ...old, phoneNumber: e.target.value }))}
                  disabled={busy}
                />
              ) : undefined
            }
          />
          {isStaff ? (
            <>
              <ProfileRow label="Mã cán bộ" value={profile?.staffId} />
              <ProfileRow
                label="Chức vụ"
                value={profile?.title}
                control={
                  isEditing ? (
                    <Input
                      aria-label="Chức vụ"
                      maxLength={100}
                      value={draft.title}
                      onChange={(e) => setDraft((old) => ({ ...old, title: e.target.value }))}
                      disabled={busy}
                    />
                  ) : undefined
                }
              />
              <ProfileRow label="Đơn vị công tác" value={profile?.orgName} />
            </>
          ) : (
            <>
              <ProfileRow label="Mã số sinh viên" value={profile?.studentId} />
              <ProfileRow label="Khóa" value={profile?.cohort} />
              <ProfileRow label="Trường / Khoa" value={profile?.faculty} />
              <ProfileRow label="Ngành học" value={profile?.major} />
              <ProfileRow label="Chi hội" value={profile?.youthUnionBranch} />
            </>
          )}
        </dl>
      </form>
      <PasswordSettings />

      <section
        aria-labelledby="personal-fanpages"
        className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 dark:bg-card sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="personal-fanpages" className="text-base font-semibold text-foreground">
            Fanpage bạn tham gia
          </h2>
          <span className="text-xs text-muted-foreground">{fanpages.length} fanpage</span>
        </div>
        {loadingFanpages ? (
          <p role="status" className="text-sm text-muted-foreground">
            Đang tải fanpage...
          </p>
        ) : fanpages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bạn chưa tham gia fanpage nào.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {fanpages.map((fp) => {
              const isAdmin = ['ADMIN', 'QUẢN TRỊ VIÊN'].includes(fp.role?.toUpperCase())
              const membership = isAdmin
                ? 'Quản trị viên'
                : ['MEMBER', 'CỘNG TÁC VIÊN'].includes(fp.role?.toUpperCase())
                  ? 'Cộng tác viên'
                  : fp.role
              return (
                <Link
                  key={fp.id}
                  to={isAdmin ? '/fanpage/admin' : '/fanpage/workspace'}
                  state={{ fanpageId: fp.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-primary">
                      {fp.avatarUrl ? (
                        <img
                          src={fp.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="break-words text-sm font-semibold text-foreground">
                        {fp.fullName || fp.name}
                      </span>
                      {membership && (
                        <span className="text-xs text-muted-foreground">{membership}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {fp.id === currentFanpage?.id && (
                      <span className="text-xs font-medium text-primary">Đang xem</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
