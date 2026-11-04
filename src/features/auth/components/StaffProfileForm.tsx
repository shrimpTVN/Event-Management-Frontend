import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react'
import { staffProfileSchema, type StaffProfileInput } from '../types/auth.schemas'
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
  CTU_DEPARTMENTS,
  CTU_POSITIONS,
  extractStaffIdFromEmail,
} from '../utils/staffProfileUtils'

interface PositionComboboxProps {
  value: string
  onChange: (val: string) => void
  error?: boolean
  placeholder?: string
}

export const PositionCombobox: React.FC<PositionComboboxProps> = ({
  value,
  onChange,
  error,
  placeholder = 'Chọn gợi ý hoặc tự nhập chức vụ...',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const trimmedVal = (value || '').trim().toLowerCase()
  const filteredPositions = CTU_POSITIONS.filter((pos) =>
    pos.toLowerCase().includes(trimmedVal)
  )

  const isExactMatch = CTU_POSITIONS.some(
    (pos) => pos.toLowerCase() === trimmedVal
  )
  const isCustomValue = Boolean(trimmedVal) && !isExactMatch

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          aria-expanded={isOpen}
          className={`h-11 pr-10 bg-white dark:bg-background ${
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-[#D1D5DB] dark:border-border focus:border-primary'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
          aria-label="Toggle danh sách chức vụ"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-[#E5E7EB] dark:border-border bg-white dark:bg-card shadow-lg z-50 py-1 text-sm animate-in fade-in-50 zoom-in-95">
          {filteredPositions.length > 0 ? (
            filteredPositions.map((pos) => {
              const isSelected = trimmedVal === pos.toLowerCase()
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => {
                    onChange(pos)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-[#F3F4F6] dark:hover:bg-muted/80 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-[#374151] dark:text-foreground'
                  }`}
                >
                  <span>{pos}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              )
            })
          ) : (
            <div className="px-3.5 py-2.5 text-xs text-muted-foreground italic">
              Không có gợi ý chức vụ khớp
            </div>
          )}

          {isCustomValue && (
            <div className="border-t border-[#F3F4F6] dark:border-border mt-1 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-primary font-medium hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>
                  Sử dụng chức vụ tự nhập: <strong>"{value}"</strong>
                </span>
                <span className="text-[11px] text-muted-foreground border border-primary/20 rounded px-1.5 py-0.5">Tự nhập</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const StaffProfileForm: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateUser } = useAuthStore()

  const pendingRaw = typeof window !== 'undefined' ? sessionStorage.getItem('pending_registration') : null
  const pending = pendingRaw ? JSON.parse(pendingRaw) : null

  const defaultEmail = searchParams.get('email') || user?.email || pending?.email || ''
  const initialStaffId = extractStaffIdFromEmail(defaultEmail)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StaffProfileInput>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      fullName: '',
      staffId: initialStaffId,
      department: '',
      position: '',
      workEmail: defaultEmail,
      phoneNumber: '',
      termsAccepted: true,
    },
  })

  // Theo dõi email và đồng bộ tự động mã cán bộ khi email được cập nhật
  useEffect(() => {
    register('position')
    if (defaultEmail) {
      setValue('workEmail', defaultEmail)
      const sid = extractStaffIdFromEmail(defaultEmail)
      if (sid) {
        setValue('staffId', sid)
      }
    }
  }, [defaultEmail, setValue, register])

  const departmentValue = watch('department')
  const positionValue = watch('position')

  const onSubmit = async (data: StaffProfileInput) => {
    try {
      setIsSubmitting(true)
      setApiError(null)
      const updatedUser = await authService.completeStaffProfile(data)
      updateUser({
        name: data.fullName || updatedUser.name,
        role: updatedUser.role || RoleEnum.FANPAGE_ADMIN,
        isProfileComplete: true,
      })
      navigate('/staff/fanpages', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || ''
      if (typeof msg === 'string' && (msg.includes('Staff ID already exists') || msg.toLowerCase().includes('staff id'))) {
        setApiError('Mã số cán bộ (CB) này đã tồn tại trong hệ thống. Vui lòng chỉnh sửa lại mã cán bộ bên dưới và bấm Lưu lại.')
        setError('staffId', {
          type: 'manual',
          message: 'Mã số cán bộ này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.',
        })
      } else if (typeof msg === 'string' && (msg.includes('already exists') || msg.toLowerCase().includes('email'))) {
        setApiError('Email hoặc thông tin tài khoản này đã tồn tại trong hệ thống.')
      } else {
        setApiError(
          msg || 'Không thể lưu hồ sơ cán bộ. Vui lòng kiểm tra lại các trường thông tin.'
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

        {/* Main Card (Form ngang 1200px tương tự trang sinh viên) */}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* 2-COLUMN GRID LAYOUT (Cân đối 3 mục mỗi cột tương tự trang Sinh viên) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* CỘT 1: I. THÔNG TIN ĐỊNH DANH CÁN BỘ */}
              <div className="space-y-5 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  I. THÔNG TIN ĐỊNH DANH CÁN BỘ
                </h2>

                {/* Họ tên */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('fullName')}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
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

                {/* Mã cán bộ */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Mã cán bộ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('staffId')}
                    placeholder="Ví dụ: CB02934"
                    className={`h-11 ${
                      errors.staffId
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.staffId ? (
                    <p className="text-xs text-destructive mt-1">{errors.staffId.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Mã định danh cán bộ tại trường</p>
                  )}
                </div>

                {/* Email trường (Chỉ đọc) */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Email trường
                  </Label>
                  <Input
                    type="email"
                    {...register('workEmail')}
                    readOnly
                    disabled
                    className="h-11 border-border bg-muted/60 text-sm text-muted-foreground cursor-not-allowed opacity-90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Chỉ đọc. Hệ thống sẽ dùng email này để gửi thông báo và xác minh vai trò.
                  </p>
                </div>
              </div>

              {/* CỘT 2: II. ĐƠN VỊ & CÔNG TÁC */}
              <div className="space-y-5 text-left">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                  II. ĐƠN VỊ & CÔNG TÁC
                </h2>

                {/* Đơn vị / Khoa / Phòng ban (Radix Select) */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Đơn vị / Khoa / Phòng ban <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={departmentValue || ''}
                    onValueChange={(val) => setValue('department', val, { shouldValidate: true })}
                  >
                    <SelectTrigger className={`h-11 w-full bg-white dark:bg-background ${errors.department ? 'border-destructive' : 'border-[#D1D5DB] dark:border-border'}`}>
                      <SelectValue placeholder="-- Chọn Đơn vị / Khoa / Phòng ban --" />
                    </SelectTrigger>
                    <SelectContent>
                      {CTU_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-xs text-destructive mt-1">{errors.department.message}</p>
                  )}
                </div>

                {/* Chức vụ (Combobox gợi ý có sẵn + cho phép tự gõ tự do) */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Chức vụ <span className="text-destructive">*</span>
                  </Label>
                  <PositionCombobox
                    value={positionValue || ''}
                    onChange={(val) => setValue('position', val, { shouldValidate: true })}
                    error={Boolean(errors.position)}
                    placeholder="Chọn gợi ý hoặc tự nhập chức vụ..."
                  />
                  {errors.position && (
                    <p className="text-xs text-destructive mt-1">{errors.position.message}</p>
                  )}
                </div>

                {/* Số điện thoại công việc */}
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium text-foreground">
                    Số điện thoại công việc <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    {...register('phoneNumber')}
                    placeholder="Ví dụ: 0912345678"
                    className={`h-11 ${
                      errors.phoneNumber
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-[#D1D5DB] dark:border-border focus:border-primary'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-destructive mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox điều khoản (Đặt bên dưới 2 cột, trải dài toàn bộ chiều rộng form) */}
            <div className="pt-2 text-left">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="h-4 w-4 rounded border-[#D1D5DB] dark:border-border text-primary focus:ring-primary shrink-0 cursor-pointer"
                />
                <span className="text-xs sm:text-[13px] text-[#374151] dark:text-foreground/90 select-none">
                  Tôi xác nhận thông tin trên là chính xác và đồng ý với điều khoản sử dụng dành cho cán bộ.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-destructive mt-1">{errors.termsAccepted.message}</p>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground max-w-lg leading-relaxed text-left">
                Bước này chỉ cần thực hiện một lần khi lần đầu đăng nhập. Thông tin sẽ được đồng bộ với hệ thống quản lý cán bộ.
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
                  className="w-full md:w-auto px-8 h-11 bg-[#1B4B8A] hover:bg-[#1E40AF] text-white flex items-center justify-center gap-2 shrink-0 shadow-sm"
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
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
