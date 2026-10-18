import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, Info } from 'lucide-react'
import { staffProfileSchema, type StaffProfileInput } from '../types/auth.schemas'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const CTU_DEPARTMENTS = [
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Trường Thủy sản',
  'Khoa Khoa học Tự nhiên',
  'Khoa Khoa học Xã hội và Nhân văn',
  'Phòng Công tác Sinh viên (CTSV)',
  'Đoàn Thanh niên - Hội Sinh viên Trường',
  'Trung tâm Hỗ trợ Học sinh - Sinh viên',
]

const CTU_POSITIONS = [
  'Cán bộ Đoàn / Hội',
  'Bí thư / Phó Bí thư Đoàn cơ sở',
  'Chủ tịch / Phó Chủ tịch Hội Sinh viên',
  'Cố vấn học tập',
  'Giảng viên quản trị sự kiện',
  'Chuyên viên phòng ban',
]

export const StaffProfileForm: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const defaultEmail = user?.email || 'canbo@ctu.edu.vn'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffProfileInput>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      fullName: user?.name || 'Nguyễn Minh Anh',
      staffId: 'CB02934',
      department: 'Khoa Môi trường và Tài nguyên Thiên nhiên',
      position: 'Cán bộ Đoàn / Hội',
      workEmail: defaultEmail,
      phoneNumber: '0987654321',
      termsAccepted: true,
    },
  })

  const onSubmit = async (data: StaffProfileInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const updatedUser = await authService.completeStaffProfile(data)
      updateUser({
        name: updatedUser.name,
        role: 'ORGANIZER',
        isProfileComplete: true,
      })
      navigate('/staff/fanpages', { replace: true })
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Không thể lưu hồ sơ cán bộ. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {/* Top Back Navigation */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Main Card (Form ngang 1200px như trang sinh viên) */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm">
          {/* Header Title & Subtitle */}
          <div className="text-left pb-6 mb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Bổ sung thông tin cán bộ
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-2 leading-relaxed">
              Vui lòng cung cấp đầy đủ thông tin để hệ thống xác minh vai trò và phạm vi quản lý.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            {/* 2-COLUMN GRID LAYOUT (Tương tự bố cục trang Sinh viên) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* CỘT 1: I. THÔNG TIN ĐỊNH DANH CÁN BỘ */}
              <div className="space-y-4 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  I. THÔNG TIN ĐỊNH DANH CÁN BỘ
                </h2>

                {/* Họ tên */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Họ tên <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="Nhập họ tên đầy đủ"
                    className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      errors.fullName
                        ? 'border-destructive focus:border-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Mã cán bộ */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Mã cán bộ <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('staffId')}
                    placeholder="Nhập mã cán bộ"
                    className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      errors.staffId
                        ? 'border-destructive focus:border-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.staffId && (
                    <p className="text-xs text-destructive mt-1">{errors.staffId.message}</p>
                  )}
                </div>

                {/* Đơn vị / Khoa / Phòng ban */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Đơn vị / Khoa / Phòng ban <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('department')}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {CTU_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-xs text-destructive mt-1">{errors.department.message}</p>
                  )}
                </div>

                {/* Chức vụ */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Chức vụ <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('position')}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {CTU_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="text-xs text-destructive mt-1">{errors.position.message}</p>
                  )}
                </div>
              </div>

              {/* CỘT 2: II. THÔNG TIN LIÊN HỆ & PHÂN QUYỀN */}
              <div className="space-y-4 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  II. LIÊN HỆ & PHÂN QUYỀN
                </h2>

                {/* Email trường (Chỉ đọc) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Email trường
                  </label>
                  <input
                    type="email"
                    {...register('workEmail')}
                    readOnly
                    className="w-full h-11 px-3.5 rounded-lg border border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Chỉ đọc. Hệ thống sẽ dùng email này để gửi thông báo và xác minh vai trò.
                  </p>
                </div>

                {/* Số điện thoại công việc */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Số điện thoại công việc <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber')}
                    placeholder="Nhập số điện thoại"
                    className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      errors.phoneNumber
                        ? 'border-destructive focus:border-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-destructive mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Notice Banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-foreground text-xs leading-relaxed">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[#374151] dark:text-muted-foreground font-medium">
                    Mã cán bộ và đơn vị sẽ được dùng để phân quyền quản trị, cấp quyền tạo sự kiện và đối soát điểm rèn luyện.
                  </p>
                </div>

                {/* Terms checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('termsAccepted')}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-[#374151] dark:text-foreground/90 leading-relaxed select-none">
                      Tôi xác nhận thông tin trên là chính xác và đồng ý với điều khoản sử dụng dành cho cán bộ.
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-xs text-destructive mt-1">{errors.termsAccepted.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground max-w-lg leading-relaxed text-left">
                Bước này chỉ cần thực hiện một lần khi lần đầu đăng nhập. Thông tin sẽ được đồng bộ với hệ thống quản lý cán bộ.
              </p>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full md:w-auto px-6 h-11 rounded-lg border border-[#D1D5DB] dark:border-border text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted font-medium text-sm transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 h-11 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* CTU Portal Footer */}
      <div className="mt-8 text-center text-xs text-[#6B7280] dark:text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/80">
          Đại học Cần Thơ (CTU) • Hệ thống quản lý sự kiện
        </p>
        <p>
          Quản trị hệ thống sự kiện CTU | Hotline:{' '}
          <span className="font-medium text-foreground/80">(0292) 3832 663</span> | Email:{' '}
          <span className="text-primary font-medium">social-admin@ctu.edu.vn</span>
        </p>
      </div>
    </div>
  )
}
