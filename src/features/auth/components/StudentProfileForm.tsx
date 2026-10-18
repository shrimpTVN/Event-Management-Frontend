import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { studentProfileSchema, type StudentProfileInput } from '../types/auth.schemas'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const CTU_FACULTIES = [
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Trường Thủy sản',
  'Khoa Khoa học Tự nhiên',
  'Khoa Khoa học Xã hội và Nhân văn',
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Khoa Sư phạm',
  'Khoa Luật',
  'Viện Nghiên cứu và Phát triển Công nghệ sinh học',
]

const CTU_ACADEMIC_YEARS = [
  'Khóa 51 (2025 - 2029)',
  'Khóa 50 (2024 - 2028)',
  'Khóa 49 (2023 - 2027)',
  'Khóa 48 (2022 - 2026)',
  'Khóa 47 (2021 - 2025)',
]

export const StudentProfileForm: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const defaultEmail = user?.email || 'nguyenvana@student.ctu.edu.vn'
  const guessedStudentId = defaultEmail.split('@')[0].toUpperCase().slice(0, 10)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: user?.name || 'Nguyễn Văn A',
      studentId: guessedStudentId.startsWith('B') ? guessedStudentId : 'B21DCCN001',
      gender: 'MALE',
      email: defaultEmail,
      faculty: 'Trường Công nghệ Thông tin và Truyền thông',
      major: 'Công nghệ thông tin (Mã ngành: 7480201)',
      className: 'DI2496A1',
      academicYear: 'Khóa 50 (2024 - 2028)',
    },
  })

  const currentGender = watch('gender')

  const onSubmit = async (data: StudentProfileInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const updatedUser = await authService.completeStudentProfile(data)
      updateUser({
        name: updatedUser.name,
        isProfileComplete: true,
      })
      navigate('/', { replace: true })
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Không thể lưu hồ sơ sinh viên. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {/* Top Back Navigation (Figma: back-navigation [1200x20]) */}
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

        {/* Main Card (Figma: form-card [1200x700]) */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm">
          {/* Header Title & Subtitle */}
          <div className="text-left pb-6 mb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Hoàn thiện hồ sơ sinh viên
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-2 leading-relaxed">
              Vui lòng bổ sung các thông tin cần thiết để hoàn tất hồ sơ lần đầu đăng nhập. Sau khi lưu,
              bạn sẽ được chuyển tới website sự kiện của trường.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            {/* 2-COLUMN LAYOUT MATCHING FIGMA FRAME 382:2283 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* CỘT 1: I. THÔNG TIN CÁ NHÂN (Figma: 382:2284 [548px]) */}
              <div className="space-y-4 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  I. THÔNG TIN CÁ NHÂN
                </h2>

                {/* Họ và tên sinh viên */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Họ và tên sinh viên <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="Nguyễn Văn A"
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

                {/* Mã sinh viên */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Mã sinh viên <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('studentId')}
                    placeholder="B21DCCN001"
                    className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      errors.studentId
                        ? 'border-destructive focus:border-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.studentId ? (
                    <p className="text-xs text-destructive mt-1">{errors.studentId.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Đã đồng bộ từ email trường</p>
                  )}
                </div>

                {/* Giới tính */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Giới tính <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-8 h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="radio"
                        value="MALE"
                        checked={currentGender === 'MALE'}
                        onChange={() => setValue('gender', 'MALE')}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Nam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="radio"
                        value="FEMALE"
                        checked={currentGender === 'FEMALE'}
                        onChange={() => setValue('gender', 'FEMALE')}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Nữ</span>
                    </label>
                  </div>
                  {errors.gender && (
                    <p className="text-xs text-destructive mt-1">{errors.gender.message}</p>
                  )}
                </div>

                {/* Email trường (Chỉ đọc) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    readOnly
                    className="w-full h-11 px-3.5 rounded-lg border border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trạng thái chỉ đọc. Thông tin này được đồng bộ từ tài khoản đăng nhập.
                  </p>
                </div>
              </div>

              {/* CỘT 2: II. THÔNG TIN HỌC TẬP (Figma: 382:2329 [548px]) */}
              <div className="space-y-4 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  II. THÔNG TIN HỌC TẬP
                </h2>

                {/* Khoa / Trường thành viên */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Khoa / Trường thành viên <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('faculty')}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {CTU_FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  {errors.faculty && (
                    <p className="text-xs text-destructive mt-1">{errors.faculty.message}</p>
                  )}
                </div>

                {/* Ngành học */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Ngành học <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('major')}
                    placeholder="Công nghệ thông tin (Mã ngành: 7480201)"
                    className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      errors.major
                        ? 'border-destructive focus:border-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.major && (
                    <p className="text-xs text-destructive mt-1">{errors.major.message}</p>
                  )}
                </div>

                {/* Lớp học & Khóa học (Side by side in 1 row matching Figma 382:2349) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Lớp học */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Lớp học <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('className')}
                      placeholder="DI2496A1"
                      className={`w-full h-11 px-3.5 rounded-lg border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.className
                          ? 'border-destructive focus:border-destructive'
                          : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                      }`}
                    />
                    {errors.className && (
                      <p className="text-xs text-destructive mt-1">{errors.className.message}</p>
                    )}
                  </div>

                  {/* Khóa học */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Khóa học <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register('academicYear')}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      {CTU_ACADEMIC_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    {errors.academicYear && (
                      <p className="text-xs text-destructive mt-1">{errors.academicYear.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row (Figma: 382:2379 [1136x68]) */}
            <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground max-w-lg leading-relaxed text-left">
                Sau khi lưu, bạn sẽ được chuyển tới website sự kiện thông thường để tiếp tục đăng ký
                hoạt động, theo dõi thông báo và cập nhật lịch sinh hoạt.
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
                  className="w-full md:w-auto px-6 h-11 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu & Chuyển tới website sự kiện</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* CTU Portal Footer (Figma: Thông tin cổng CTU [966:5445]) */}
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
