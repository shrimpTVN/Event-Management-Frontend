import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { studentProfileSchema, type StudentProfileInput } from '../types/auth.schemas'
import { RoleEnum } from '../types/auth.types'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  CTU_FACULTIES,
  CTU_ACADEMIC_YEARS,
  extractStudentIdFromEmail,
} from '../utils/studentProfileUtils'

export const StudentProfileForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateUser } = useAuthStore()

  const pendingRaw = typeof window !== 'undefined' ? sessionStorage.getItem('pending_registration') : null
  const pending = pendingRaw ? JSON.parse(pendingRaw) : null

  const defaultEmail = searchParams.get('email') || user?.email || pending?.email || ''
  const initialStudentId = extractStudentIdFromEmail(defaultEmail)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: '',
      studentId: initialStudentId,
      gender: 'MALE',
      email: defaultEmail,
      faculty: '',
      major: '',
      className: '',
      academicYear: '',
    },
  })

  // Theo dõi email và đồng bộ tự động MSSV khi email được cập nhật
  useEffect(() => {
    if (defaultEmail) {
      setValue('email', defaultEmail)
      const sid = extractStudentIdFromEmail(defaultEmail)
      if (sid) {
        setValue('studentId', sid)
      }
    }
  }, [defaultEmail, setValue])

  const currentGender = watch('gender')
  const facultyValue = watch('faculty')
  const academicYearValue = watch('academicYear')

  const onSubmit = async (data: StudentProfileInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const updatedUser = await authService.completeStudentProfile(data)
      updateUser({
        name: data.fullName || updatedUser.name,
        studentId: data.studentId || updatedUser.studentId,
        role: updatedUser.role || RoleEnum.STUDENT,
        isProfileComplete: true,
      })
      navigate(searchParams.get('redirect') || '/', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || ''
      if (typeof msg === 'string' && (msg.includes('Student ID already exists') || msg.toLowerCase().includes('student id'))) {
        setApiError('Mã số sinh viên (MSSV) này đã tồn tại trong hệ thống. Vui lòng chỉnh sửa lại mã số sinh viên bên dưới và bấm Lưu lại.')
        setError('studentId', {
          type: 'manual',
          message: 'Mã số sinh viên này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.',
        })
      } else if (typeof msg === 'string' && (msg.includes('already exists') || msg.toLowerCase().includes('email'))) {
        setApiError('Email hoặc thông tin tài khoản này đã tồn tại trong hệ thống.')
      } else {
        setApiError(
          msg || 'Không thể lưu hồ sơ sinh viên. Vui lòng kiểm tra lại các trường thông tin.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout notranslate relative min-h-screen w-full overflow-x-hidden bg-[#F0F2F5] dark:bg-background flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] w-full space-y-4 my-auto">
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

        {/* Main Card */}
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
              {/* CỘT 1: I. THÔNG TIN CÁ NHÂN */}
              <div className="space-y-5 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  I. THÔNG TIN CÁ NHÂN
                </h2>

                {/* Họ và tên sinh viên */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Họ và tên sinh viên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('fullName')}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className={`h-11 ${
                      errors.fullName
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Mã sinh viên (Tự động lấy từ email) */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Mã sinh viên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('studentId')}
                    placeholder="Ví dụ: B2303827"
                    className={`h-11 ${
                      errors.studentId
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.studentId ? (
                    <p className="text-xs text-destructive mt-1">{errors.studentId.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tự động trích xuất từ email sinh viên</p>
                  )}
                </div>

                {/* Giới tính */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Giới tính <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-8 h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-white dark:bg-background">
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
                  <Label className="block text-sm font-medium text-foreground">
                    Email sinh viên
                  </Label>
                  <Input
                    type="email"
                    {...register('email')}
                    readOnly
                    disabled
                    className="h-11 border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed opacity-90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trạng thái chỉ đọc. Thông tin này được đồng bộ từ tài khoản đăng nhập.
                  </p>
                </div>
              </div>

              {/* CỘT 2: II. THÔNG TIN HỌC TẬP */}
              <div className="space-y-5 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  II. THÔNG TIN HỌC TẬP
                </h2>

                {/* Khoa / Trường thành viên (Radix Select) */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Khoa / Trường thành viên <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={facultyValue || undefined}
                    onValueChange={(val) => setValue('faculty', val, { shouldValidate: true })}
                  >
                    <SelectTrigger className={`h-11 w-full bg-white dark:bg-background ${errors.faculty ? 'border-destructive' : 'border-[#D1D5DB] dark:border-border'}`}>
                      <SelectValue placeholder="-- Chọn Khoa / Trường thành viên --" />
                    </SelectTrigger>
                    <SelectContent>
                      {CTU_FACULTIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.faculty && (
                    <p className="text-xs text-destructive mt-1">{errors.faculty.message}</p>
                  )}
                </div>

                {/* Ngành học */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Ngành học <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('major')}
                    placeholder="Ví dụ: Kỹ thuật phần mềm (Mã ngành: 7480103)"
                    className={`h-11 ${
                      errors.major
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.major && (
                    <p className="text-xs text-destructive mt-1">{errors.major.message}</p>
                  )}
                </div>

                {/* Lớp học & Khóa học */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Lớp học */}
                  <div className="space-y-1.5">
                    <Label className="block text-sm font-medium text-foreground">
                      Lớp học <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      {...register('className')}
                      placeholder="Ví dụ: DI2396A1"
                      className={`h-11 ${
                        errors.className
                          ? 'border-destructive focus-visible:ring-destructive'
                          : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                      }`}
                    />
                    {errors.className && (
                      <p className="text-xs text-destructive mt-1">{errors.className.message}</p>
                    )}
                  </div>

                  {/* Khóa học (Radix Select) */}
                  <div className="space-y-1.5">
                    <Label className="block text-sm font-medium text-foreground">
                      Khóa học <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={academicYearValue || undefined}
                      onValueChange={(val) => setValue('academicYear', val, { shouldValidate: true })}
                    >
                      <SelectTrigger className={`h-11 w-full bg-white dark:bg-background ${errors.academicYear ? 'border-destructive' : 'border-[#D1D5DB] dark:border-border'}`}>
                        <SelectValue placeholder="-- Chọn Khóa học --" />
                      </SelectTrigger>
                      <SelectContent>
                        {CTU_ACADEMIC_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.academicYear && (
                      <p className="text-xs text-destructive mt-1">{errors.academicYear.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground max-w-lg leading-relaxed text-left">
                Sau khi lưu, bạn sẽ được chuyển tới website sự kiện thông thường để tiếp tục đăng ký
                hoạt động, theo dõi thông báo và cập nhật lịch sinh hoạt.
              </p>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full md:w-auto px-6 h-11"
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-6 h-11 bg-[#1B4B8A] hover:bg-[#1E40AF] text-white flex items-center justify-center gap-2 shrink-0 shadow-sm"
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
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
