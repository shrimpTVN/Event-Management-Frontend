import { mediaService } from '@/shared/services/mediaService'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  FileText,
  Trash2,
  Camera,
  Upload,
  AlertCircle,
  Building,
} from 'lucide-react'
import { apiClient } from '@/shared'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNIT_TYPES = [
  'Khoa / Viện đào tạo',
  'Câu lạc bộ / Đội / Nhóm',
  'Đoàn / Hội trực thuộc',
  'Phòng ban chức năng',
  'Trung tâm nghiên cứu / dịch vụ',
]

const MANAGING_FACULTIES = [
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Trường Sư phạm',
  'Khoa Khoa học Tự nhiên',
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Phòng Công tác Sinh viên (CTSV)',
  'Đoàn Thanh niên - Hội Sinh viên CTU',
  'Trường Đại học Cần Thơ',
]

export const FanpageRegistrationForm: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Form states mapping directly to schema.sql & API DTO
  const [fanpageName, setFanpageName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  useEffect(
    () => () => {
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview]
  )
  const [unitType, setUnitType] = useState('Câu lạc bộ / Đội / Nhóm')
  const [parentOrg, setParentOrg] = useState('Trường Công nghệ Thông tin và Truyền thông')
  const [orgName, setOrgName] = useState('')
  const [helpEmail, setHelpEmail] = useState('')
  const [helpPhone, setHelpPhone] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [profilePrompt, setProfilePrompt] = useState<'student' | 'staff' | null>(null)

  useEffect(() => {
    let active = true
    const checkEligibility = async () => {
      try {
        if (typeof authService.getFanpageRegistrationEligibility === 'function') {
          const eligibility = await authService.getFanpageRegistrationEligibility()
          if (active && eligibility.status === 'PROFILE_REQUIRED') {
            setProfilePrompt('staff')
          }
        }
      } catch {
        // Fallback: do nothing, submission will validate
      }
    }
    void checkEligibility()
    return () => {
      active = false
    }
  }, [])

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      ) {
        setSubmitError('Logo phải là PNG, JPG hoặc WEBP, tối đa 5 MB.')
        return
      }
      setUploadedAvatarUrl('')
      setAvatarFile(file)
      const preview = URL.createObjectURL(file)
      setAvatarPreview(preview)
    }
  }

  const handleRemoveAvatar = () => {
    setUploadedAvatarUrl('')
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (
        !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      ) {
        setSubmitError('Minh chứng phải là PDF, PNG, JPG hoặc WEBP, tối đa 10 MB.')
        return
      }
      setEvidenceUrl('')
      setUploadedFiles([file])
    }
  }

  const handleRemoveFile = (index: number) => {
    setEvidenceUrl('')
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (!fanpageName.trim()) throw new Error('Vui lòng nhập tên fanpage.')
      if (!avatarFile || !uploadedFiles[0])
        throw new Error('Vui lòng chọn logo và một tệp minh chứng.')
      const avatarUrl = uploadedAvatarUrl || (await mediaService.uploadImage(avatarFile, 'FANPAGE'))
      setUploadedAvatarUrl(avatarUrl)
      const proofUrl = evidenceUrl || (await mediaService.uploadImage(uploadedFiles[0], 'EVIDENCE'))
      setEvidenceUrl(proofUrl)
      if (!avatarUrl || !proofUrl) throw new Error('Tải tệp chưa thành công. Vui lòng thử lại.')

      await apiClient.post('/fanpages/fanpage-admin/register', {
        name: fanpageName,
        description: description || 'Fanpage ' + fanpageName,
        avatarUrl,
        evidenceUrl: proofUrl,
        orgType: unitType,
        orgName: orgName || fanpageName,
        parentOrg,
        helpContact: helpEmail || user?.email || '',
        helpPhone: helpPhone.trim() || undefined,
      })

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Fanpage registration error:', err)
      const errCode = err?.response?.data?.code || err?.response?.data?.exceptionCode
      const errMsg = (err?.response?.data?.message || err?.message || '').toString()

      if (errCode === 'USER.001') {
        setProfilePrompt('student')
      } else if (
        errCode === 'USER.002' ||
        errCode === 'FANPAGE_ADMIN_PROFILE_REQUIRED' ||
        errMsg.toLowerCase().includes('fanpage admin profile') ||
        errMsg.toLowerCase().includes('profile') ||
        errMsg.toLowerCase().includes('hồ sơ')
      ) {
        setProfilePrompt('staff')
      } else {
        setSubmitError(errMsg || 'Đã có lỗi xảy ra khi gửi hồ sơ đăng ký. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white dark:bg-card rounded-2xl border border-border p-8 text-center space-y-5 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-k2d font-bold text-2xl text-foreground">
            Đã gửi yêu cầu đăng ký fanpage!
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hồ sơ thành lập{' '}
            <span className="font-semibold text-foreground">"{fanpageName || 'Fanpage mới'}"</span>{' '}
            đã được gửi đến Ban Quản trị hệ thống CTU để thẩm định trong 03 ngày làm việc. Kết quả
            sẽ được thông báo qua email{' '}
            <span className="font-medium text-foreground">
              {user?.email || helpEmail || 'của bạn'}
            </span>
            .
          </p>
          <div className="pt-2">
            <Button type="button" onClick={() => navigate('/staff/fanpages')} className="px-6 h-10">
              Về danh sách fanpage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {/* Top Back Navigation */}
        <div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/staff/fanpages')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách fanpage</span>
          </Button>
        </div>

        {/* Main Form Card */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Card Header */}
          <div className="pb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Đăng ký thành lập fanpage mới
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-1.5 leading-relaxed">
              Cung cấp thông tin để gửi hồ sơ thành lập fanpage trên Cổng sự kiện CTU. Ban Quản trị
              hệ thống sẽ thẩm định hồ sơ trong 03 ngày làm việc.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <fieldset disabled={isSubmitting} className="contents">
              {submitError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* THÔNG TIN NGƯỜI ĐĂNG KÝ HỒ SƠ */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-muted/40 border border-[#E5E7EB] dark:border-border text-xs">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(user?.name || 'CB').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm truncate">
                      {user?.name || 'Nguyễn Minh Anh'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                      Người đăng ký
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate">
                    {user?.email || 'canbo@ctu.edu.vn'}
                  </p>
                </div>
              </div>

              {/* KHU VỰC LOGO / ẢNH ĐẠI DIỆN FANPAGE (THIẾT KẾ GỌN GÀNG, KHÔNG DÙNG HỘP DOTTED TO TRỐNG) */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-full border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-muted overflow-hidden flex items-center justify-center shadow-xs">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Logo fanpage"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/70">
                        <Camera className="h-6 w-6 mb-1 text-primary/70" />
                        <span className="text-[10px] font-medium">Logo</span>
                      </div>
                    )}
                  </div>
                  <Tooltip content="Tải ảnh lên">
                    <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1B4B8A] hover:bg-[#1E40AF] text-white shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center">
                      <Upload className="h-3.5 w-3.5" />
                      <Input
                        type="file"
                        aria-label="Logo fanpage"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                  </Tooltip>
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      Ảnh đại diện / Logo fanpage
                    </span>
                    <span className="text-xs text-muted-foreground">Bắt buộc</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Định dạng hỗ trợ: PNG, JPG, WEBP • Kích thước tối đa 5 MB.
                  </p>
                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#D1D5DB] dark:border-border bg-white dark:bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer shadow-2xs transition-colors">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      <span>{avatarPreview ? 'Đổi ảnh khác' : 'Chọn ảnh từ thiết bị'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                    {avatarPreview && (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        Xóa ảnh
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* LƯỚI CÁC TRƯỜNG NHẬP LIỆU (2 CỘT CÂN XỨNG) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tên fanpage */}
                <div className="space-y-2">
                  <Label htmlFor="fanpageName">
                    Tên fanpage <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fanpageName"
                    required
                    value={fanpageName}
                    onChange={(e) => setFanpageName(e.target.value)}
                    placeholder="Ví dụ: CLB Sáng tạo Trẻ CTU, Đoàn Khoa KHTN..."
                  />
                </div>

                {/* Loại hình tổ chức */}
                <div className="space-y-2">
                  <Label>
                    Loại hình tổ chức <span className="text-destructive">*</span>
                  </Label>
                  <Select value={unitType} onValueChange={setUnitType}>
                    <SelectTrigger className="h-10 border-[#D1D5DB] dark:border-border bg-white dark:bg-background">
                      <SelectValue placeholder="Chọn loại hình" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-md">
                      {UNIT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tên đơn vị trực tiếp */}
                <div className="space-y-2">
                  <Label htmlFor="orgName">
                    Tên đơn vị trực tiếp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ví dụ: Ban Chủ nhiệm CLB Sáng tạo Trẻ, Liên chi đoàn..."
                  />
                </div>

                {/* Đơn vị chủ quản cấp trên */}
                <div className="space-y-2">
                  <Label>
                    Đơn vị chủ quản cấp trên <span className="text-destructive">*</span>
                  </Label>
                  <Select value={parentOrg} onValueChange={setParentOrg}>
                    <SelectTrigger className="h-10 border-[#D1D5DB] dark:border-border bg-white dark:bg-background">
                      <SelectValue placeholder="Chọn đơn vị chủ quản" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-md">
                      {MANAGING_FACULTIES.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email liên hệ */}
                <div className="space-y-2">
                  <Label htmlFor="helpEmail">
                    Email liên hệ chính thức <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="helpEmail"
                    type="email"
                    required
                    value={helpEmail}
                    onChange={(e) => setHelpEmail(e.target.value)}
                    placeholder="Ví dụ: clb.sangtaotre@ctu.edu.vn"
                  />
                </div>

                {/* Số điện thoại hỗ trợ */}
                <div className="space-y-2">
                  <Label htmlFor="helpPhone">
                    Số điện thoại liên hệ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="helpPhone"
                    type="tel"
                    required
                    value={helpPhone}
                    onChange={(e) => setHelpPhone(e.target.value)}
                    placeholder="Ví dụ: 0292 387 2254 hoặc 0912 345 678"
                  />
                </div>

                {/* Mô tả fanpage */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">
                      Mô tả hoạt động fanpage <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {description.length} / 500 ký tự
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    required
                    rows={3}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả mục đích hoạt động, đối tượng hướng tới và các chương trình sự kiện chính..."
                  />
                </div>

                {/* Minh chứng thành lập */}
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Minh chứng thành lập / quyết định ủy quyền{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative border-2 border-dashed border-[#D1D5DB] dark:border-border rounded-xl p-5 text-center hover:bg-muted/30 transition-colors flex flex-col items-center justify-center cursor-pointer">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      aria-label="Minh chứng thành lập"
                      disabled={isSubmitting}
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-7 w-7 text-primary mb-1.5" />
                    <p className="text-sm font-semibold text-foreground">
                      Kéo thả tệp vào đây hoặc chọn tệp từ thiết bị
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Một tệp PDF, JPG, PNG hoặc WEBP · Tối đa 10 MB
                    </p>
                  </div>

                  {/* Danh sách tệp đã tải lên */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {uploadedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] dark:bg-muted border border-border text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium truncate">{f.name}</span>
                            <span className="text-muted-foreground shrink-0">
                              ({(f.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            disabled={isSubmitting}
                            variant="ghost"
                            aria-label="Xóa tệp minh chứng"
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-6 border-t border-[#F3F4F6] dark:border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                  Hồ sơ sẽ được chuyển đến Ban Quản trị hệ thống CTU để xét duyệt.
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/staff/fanpages')}
                    className="w-full sm:w-auto px-6 h-10"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 h-10"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
                  </Button>
                </div>
              </div>
            </fieldset>
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

      {/* Modal yêu cầu hoàn thiện thông tin Cán bộ / Ban tổ chức (USER.002) */}
      {profilePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Building className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 text-left flex-1">
                <h3 className="font-bold text-lg text-foreground font-heading">
                  {profilePrompt === 'student'
                    ? 'Hoàn thiện hồ sơ sinh viên'
                    : 'Yêu cầu thông tin Cán bộ / Ban tổ chức'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profilePrompt === 'student'
                    ? 'Bạn cần cập nhật mã số sinh viên trước khi đăng ký thành lập fanpage.'
                    : 'Bạn cần cập nhật hồ sơ Cán bộ / Đơn vị (Mã cán bộ, Đơn vị trực thuộc) trước khi đăng ký thành lập fanpage.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfilePrompt(null)}
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                Để sau
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setProfilePrompt(null)
                  navigate(
                    `/onboarding/${profilePrompt === 'student' ? 'student' : 'staff'}?redirect=/register/fanpage`
                  )
                }}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Cập nhật thông tin ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
