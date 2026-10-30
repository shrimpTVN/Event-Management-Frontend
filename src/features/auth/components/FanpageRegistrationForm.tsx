import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UploadCloud, CheckCircle2, FileText, Trash2, Camera, Upload } from 'lucide-react'
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
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [unitType, setUnitType] = useState('Câu lạc bộ / Đội / Nhóm')
  const [parentOrg, setParentOrg] = useState('Trường Công nghệ Thông tin và Truyền thông')
  const [orgName, setOrgName] = useState('')
  const [helpEmail, setHelpEmail] = useState('')
  const [helpPhone, setHelpPhone] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      const preview = URL.createObjectURL(file)
      setAvatarPreview(preview)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - uploadedFiles.length)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (avatarFile) {
      void avatarFile.name
    }
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1000)
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
            Hồ sơ thành lập <span className="font-semibold text-foreground">"{fanpageName || 'Fanpage mới'}"</span> đã
            được gửi đến Ban Quản trị hệ thống CTU để thẩm định trong 03 ngày làm việc. Kết quả sẽ được
            thông báo qua email <span className="font-medium text-foreground">{user?.email || helpEmail || 'của bạn'}</span>.
          </p>
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => navigate('/staff/fanpages')}
              className="px-6 h-10"
            >
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
          <button
            type="button"
            onClick={() => navigate('/staff/fanpages')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách fanpage</span>
          </button>
        </div>

        {/* Main Form Card */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Card Header */}
          <div className="pb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Đăng ký thành lập fanpage mới
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-1.5 leading-relaxed">
              Cung cấp thông tin để gửi hồ sơ thành lập fanpage trên Cổng sự kiện CTU. Ban Quản trị hệ thống sẽ thẩm định hồ sơ trong 03 ngày làm việc.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                  <span className="font-bold text-foreground text-sm truncate">{user?.name || 'Nguyễn Minh Anh'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                    Người đăng ký
                  </span>
                </div>
                <p className="text-muted-foreground truncate">{user?.email || 'canbo@ctu.edu.vn'}</p>
              </div>
            </div>

            {/* KHU VỰC LOGO / ẢNH ĐẠI DIỆN FANPAGE (THIẾT KẾ GỌN GÀNG, KHÔNG DÙNG HỘP DOTTED TO TRỐNG) */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-full border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-muted overflow-hidden flex items-center justify-center shadow-xs">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Logo fanpage" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/70">
                      <Camera className="h-6 w-6 mb-1 text-primary/70" />
                      <span className="text-[10px] font-medium">Logo</span>
                    </div>
                  )}
                </div>
                <label
                  title="Tải ảnh lên"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1B4B8A] hover:bg-[#1E40AF] text-white shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-semibold text-sm text-foreground">Ảnh đại diện / Logo fanpage</span>
                  <span className="text-xs text-muted-foreground">(Không bắt buộc)</span>
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
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
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
                  Minh chứng thành lập / quyết định ủy quyền <span className="text-destructive">*</span>
                </Label>
                <div className="relative border-2 border-dashed border-[#D1D5DB] dark:border-border rounded-xl p-5 text-center hover:bg-muted/30 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.jpg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-7 w-7 text-primary mb-1.5" />
                  <p className="text-sm font-semibold text-foreground">
                    Kéo thả tệp vào đây hoặc chọn tệp từ thiết bị
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Định dạng: PDF, DOCX, JPG, PNG • Tối đa 10 MB/tệp (tối đa 5 tệp)
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
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(i)}
                          className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
