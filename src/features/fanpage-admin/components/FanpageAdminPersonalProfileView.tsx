import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  UserRound,
  Mail,
  Building,
  GraduationCap,
  CheckCircle2,
  Pencil,
  X,
  Save,
  ArrowLeft,
  Briefcase,
  Users,
  Camera,
  Loader2,
} from 'lucide-react'
import { mediaService } from '@/shared/services/mediaService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isStaffUser } from '@/features/auth'
import { profileService, type StudentProfile } from '@/features/profile'
import { fanpageAdminService } from '../services/fanpageAdminService'
import type { FanpageSummary } from '../types/fanpageAdmin.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FanpageAdminPersonalProfileViewProps {
  currentFanpage?: FanpageSummary
  onBack?: () => void
}

export const FanpageAdminPersonalProfileView: React.FC<FanpageAdminPersonalProfileViewProps> = ({
  currentFanpage,
  onBack,
}) => {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isStaff =
    Boolean(user && isStaffUser(user)) ||
    user?.email?.includes('organizer') ||
    user?.email?.includes('staff') ||
    user?.email?.includes('admin@ctu.edu.vn')

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP).' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Dung lượng ảnh tối đa là 5MB.' })
      return
    }

    try {
      setIsUploadingAvatar(true)
      const secureUrl = await mediaService.uploadImage(file, 'AVATAR')
      await profileService.updateAvatar(secureUrl)
      useAuthStore.getState().updateUser({ avatarUrl: secureUrl })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage-members'] })
      queryClient.invalidateQueries({ queryKey: ['staff-my-fanpages'] })
      setFeedback({ type: 'success', message: 'Đã cập nhật ảnh đại diện lên Cloudinary thành công!' })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Không thể tải ảnh đại diện lên Cloudinary.' })
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Fetch real profile from backend (/users/me/profile) for all users (including staff)
  const { data: currentProfile } = useQuery<StudentProfile>({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getMyProfile(),
    enabled: Boolean(user?.email),
  })

  // Sync avatarUrl into useAuthStore if available
  useEffect(() => {
    if (currentProfile?.avatarUrl && currentProfile.avatarUrl !== user?.avatarUrl) {
      useAuthStore.getState().updateUser({ avatarUrl: currentProfile.avatarUrl })
    }
  }, [currentProfile?.avatarUrl, user?.avatarUrl])

  // Fetch real participating fanpages
  const { data: availableFanpages = [] } = useQuery<FanpageSummary[]>({
    queryKey: ['admin-available-fanpages'],
    queryFn: () => fanpageAdminService.getAvailableFanpages(),
  })

  // Staff profile state fallback/defaults
  const [staffData, setStaffData] = useState({
    fullName: user?.name || 'Nguyễn Minh Anh',
    staffId: 'CB-0104',
    title: 'Bí thư Đoàn khoa',
    department: 'Đoàn Trường CNTT&TT',
    email: user?.email || 'organizer@ctu.edu.vn',
    phoneNumber: '02923872254',
    gender: 'Nữ',
    dob: '15/10/1995',
  })

  // Student editable state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    studentId: '',
    faculty: '',
    classId: '',
    youthUnionBranch: '',
    email: '',
    phoneNumber: '',
    gender: 'Nam' as 'Nam' | 'Nữ' | 'Khác',
    dob: '',
  })

  useEffect(() => {
    if (currentProfile) {
      if (isStaff) {
        setStaffData((prev) => ({
          ...prev,
          fullName: currentProfile.fullName || user?.name || prev.fullName,
          staffId: currentProfile.studentId || prev.staffId,
          department: currentProfile.faculty || prev.department,
          email: currentProfile.email || user?.email || prev.email,
          phoneNumber: currentProfile.phoneNumber || prev.phoneNumber,
          gender: currentProfile.gender || prev.gender,
          dob: currentProfile.dateOfBirth || prev.dob,
        }))
      } else {
        setStudentForm({
          fullName: currentProfile.fullName || user?.name || 'Đoàn Tài Lộc',
          studentId: currentProfile.studentId || user?.studentId || 'B2300000',
          faculty: currentProfile.faculty || 'Trường CNTT & TT',
          classId: currentProfile.classId || 'KTPM K49',
          youthUnionBranch: currentProfile.youthUnionBranch || 'Chi hội KTPM K49',
          email: currentProfile.email || user?.email || 'loc@student.ctu.edu.vn',
          phoneNumber: currentProfile.phoneNumber || '0901 234 567',
          gender: currentProfile.gender || 'Nam',
          dob: currentProfile.dateOfBirth || '20/05/2005',
        })
      }
    }
  }, [currentProfile, user, isStaff])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isStaff) {
        await profileService.updateMyProfile({
          fullName: staffData.fullName,
          phoneNumber: staffData.phoneNumber,
          gender: staffData.gender as any,
          dateOfBirth: staffData.dob,
        })
        useAuthStore.getState().updateUser({ name: staffData.fullName })
      } else {
        await profileService.updateMyProfile({
          fullName: studentForm.fullName,
          phoneNumber: studentForm.phoneNumber,
          gender: studentForm.gender,
          dateOfBirth: studentForm.dob,
        })
        useAuthStore.getState().updateUser({ name: studentForm.fullName })
      }
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Cập nhật thông tin tài khoản cá nhân thành công!' })
      setTimeout(() => setFeedback(null), 4000)
    } catch {
      setFeedback({ type: 'error', message: 'Không thể cập nhật thông tin. Vui lòng thử lại.' })
    }
  }

  const displayName = isStaff
    ? staffData.fullName
    : currentProfile?.fullName || user?.name || 'Đoàn Tài Lộc'

  const displayAvatar = user?.avatarUrl || currentProfile?.avatarUrl

  const displayId = isStaff
    ? `Mã CB: ${staffData.staffId}`
    : `MSSV: ${studentForm.studentId || user?.studentId || 'B2303827'}`

  const roleLabel = isStaff ? 'Cán bộ · Quản trị viên Fanpage' : 'Sinh viên · Cộng tác viên Fanpage'

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-200">
      {/* 1. Breadcrumbs & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Quản trị fanpage</span>
            <span>/</span>
            <span className="text-[#1B4B8A] dark:text-blue-400 font-medium">Tài khoản cá nhân</span>
          </div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Thông tin tài khoản cá nhân
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xem và cập nhật hồ sơ cá nhân của bạn trong hệ thống quản lý sự kiện CTU.
          </p>
        </div>

        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="self-start sm:self-auto gap-2 text-xs border-border/80 hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Fanpage</span>
          </Button>
        )}
      </div>

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* 3. Profile Overview Banner Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-xs relative cursor-pointer"
              title="Nhấn để tải ảnh đại diện lên Cloudinary"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1B4B8A] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-0.5">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-[8px] font-medium">Tải...</span>
                </div>
              )}

              {!isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <Camera className="h-5 w-5" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Tải ảnh lên Cloudinary"
              className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-card hover:bg-muted rounded-full shadow-xs cursor-pointer border border-border transition-colors"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Camera className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400" />
              )}
            </button>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-sans font-bold text-lg sm:text-xl text-foreground truncate">
                {displayName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1B4B8A]/10 text-[#1B4B8A] dark:text-blue-400 font-semibold text-[11px]">
                {displayId}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{roleLabel}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{user?.email || staffData.email}</span>
            </p>
          </div>
        </div>

        <div className="self-end sm:self-auto shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="gap-1.5 text-xs rounded-xl cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Hủy</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="gap-1.5 text-xs bg-[#1B4B8A] hover:bg-[#163e72] text-white rounded-xl cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu thay đổi</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 text-xs rounded-xl border-border/80 hover:bg-muted cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-[#1B4B8A] dark:text-blue-400" />
              <span>Chỉnh sửa thông tin</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4. Details Information Cards */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Thông tin công tác / học vụ */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            {isStaff ? (
              <Building className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400" />
            ) : (
              <GraduationCap className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400" />
            )}
            <h3 className="font-bold text-sm text-foreground">
              {isStaff ? 'Thông tin công tác & chức vụ' : 'Thông tin học vụ'}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            {isStaff ? (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Mã số cán bộ</Label>
                  <Input
                    type="text"
                    value={staffData.staffId}
                    disabled
                    className="h-9 text-xs bg-muted/40 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Chức vụ</Label>
                  <Input
                    type="text"
                    value={staffData.title}
                    disabled={!isEditing}
                    onChange={(e) => setStaffData({ ...staffData, title: e.target.value })}
                    className={`h-9 text-xs ${!isEditing ? 'bg-muted/40' : 'bg-white dark:bg-background'}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Đơn vị công tác</Label>
                  <Input
                    type="text"
                    value={staffData.department}
                    disabled
                    className="h-9 text-xs bg-muted/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Vai trò hệ thống</Label>
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/40 flex items-center text-xs font-semibold text-primary">
                    FANPAGE_ADMIN (Quản trị viên Fanpage)
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Mã số sinh viên (MSSV)</Label>
                  <Input
                    type="text"
                    value={studentForm.studentId}
                    disabled
                    className="h-9 text-xs bg-muted/40 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Lớp sinh hoạt</Label>
                  <Input
                    type="text"
                    value={studentForm.classId}
                    disabled
                    className="h-9 text-xs bg-muted/40 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Khoa / Đơn vị đào tạo</Label>
                  <Input
                    type="text"
                    value={studentForm.faculty}
                    disabled
                    className="h-9 text-xs bg-muted/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Chi đoàn / Chi hội</Label>
                  <Input
                    type="text"
                    value={studentForm.youthUnionBranch}
                    disabled
                    className="h-9 text-xs bg-muted/40"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Thông tin cá nhân & Liên hệ */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <UserRound className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400" />
            <h3 className="font-bold text-sm text-foreground">Thông tin cá nhân & Liên hệ</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Họ và tên</Label>
              <Input
                type="text"
                value={isStaff ? staffData.fullName : studentForm.fullName}
                disabled={!isEditing}
                onChange={(e) =>
                  isStaff
                    ? setStaffData({ ...staffData, fullName: e.target.value })
                    : setStudentForm({ ...studentForm, fullName: e.target.value })
                }
                className={`h-9 text-xs ${!isEditing ? 'bg-muted/40' : 'bg-white dark:bg-background'}`}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Email liên hệ (CTU)</Label>
              <Input
                type="email"
                value={user?.email || staffData.email}
                disabled
                className="h-9 text-xs bg-muted/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Số điện thoại</Label>
                <Input
                  type="text"
                  value={isStaff ? staffData.phoneNumber : studentForm.phoneNumber}
                  disabled={!isEditing}
                  onChange={(e) =>
                    isStaff
                      ? setStaffData({ ...staffData, phoneNumber: e.target.value })
                      : setStudentForm({ ...studentForm, phoneNumber: e.target.value })
                  }
                  className={`h-9 text-xs ${!isEditing ? 'bg-muted/40' : 'bg-white dark:bg-background'}`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Giới tính</Label>
                <Input
                  type="text"
                  value={isStaff ? staffData.gender : studentForm.gender}
                  disabled={!isEditing}
                  onChange={(e) =>
                    isStaff
                      ? setStaffData({ ...staffData, gender: e.target.value })
                      : setStudentForm({
                          ...studentForm,
                          gender: e.target.value as 'Nam' | 'Nữ' | 'Khác',
                        })
                  }
                  className={`h-9 text-xs ${!isEditing ? 'bg-muted/40' : 'bg-white dark:bg-background'}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Ngày sinh</Label>
              <Input
                type="text"
                value={isStaff ? staffData.dob : studentForm.dob}
                disabled={!isEditing}
                onChange={(e) =>
                  isStaff
                    ? setStaffData({ ...staffData, dob: e.target.value })
                    : setStudentForm({ ...studentForm, dob: e.target.value })
                }
                className={`h-9 text-xs ${!isEditing ? 'bg-muted/40' : 'bg-white dark:bg-background'}`}
              />
            </div>
          </div>
        </div>
      </form>

      {/* 5. Fanpages Managed / Participated Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400" />
            <h3 className="font-bold text-sm text-foreground">
              {isStaff ? 'Fanpage bạn đang quản lý' : 'Fanpage bạn tham gia ban tổ chức'}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {availableFanpages.length} trang
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableFanpages.map((fp) => {
            const isCurrent = fp.id === currentFanpage?.id
            return (
              <div
                key={fp.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#1B4B8A] bg-blue-50/30 dark:bg-blue-950/20'
                    : 'border-border/80 bg-white dark:bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {fp.avatarUrl ? (
                    <img
                      src={fp.avatarUrl}
                      alt={fp.name}
                      className="h-9 w-9 rounded-full object-cover shrink-0 border border-border/60"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#1B4B8A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {fp.code || fp.avatarText || 'FP'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {fp.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {fp.role || 'Quản trị viên'}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="px-2 py-0.5 rounded-full bg-[#1B4B8A] text-white text-[10px] font-semibold shrink-0">
                    Đang xem
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
