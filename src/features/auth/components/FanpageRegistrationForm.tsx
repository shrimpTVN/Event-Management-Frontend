import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UploadCloud, Info, CheckCircle2, FileText, Trash2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const UNIT_TYPES = [
  'Khoa / Viện đào tạo',
  'Câu lạc bộ / Đội / Nhóm',
  'Đoàn / Hội trực thuộc',
  'Phòng ban chức năng',
  'Trung tâm nghiên cứu / dịch vụ',
]

const MANAGING_FACULTIES = [
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Khoa Khoa học Tự nhiên',
  'Phòng Công tác Sinh viên (CTSV)',
  'Đoàn Thanh niên - Hội Sinh viên CTU',
]

export const FanpageRegistrationForm: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [fanpageName, setFanpageName] = useState(
    'Fanpage Khoa Môi trường và Tài nguyên Thiên nhiên'
  )
  const [unitType, setUnitType] = useState('Khoa / Viện đào tạo')
  const [managingUnit, setManagingUnit] = useState('Khoa Môi trường và Tài nguyên Thiên nhiên')
  const [description, setDescription] = useState(
    'Kênh thông tin chính thức của Khoa Môi trường và Tài nguyên Thiên nhiên, cập nhật hoạt động học thuật, nghiên cứu, tuyển sinh và các sự kiện dành cho sinh viên CTU.'
  )
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
            Hồ sơ thành lập <span className="font-semibold text-foreground">"{fanpageName}"</span> đã
            được gửi đến Ban Truyền thông CTU để thẩm định trong 03 ngày làm việc. Kết quả sẽ được
            thông báo qua email của bạn.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/staff/fanpages')}
              className="px-6 h-11 rounded-lg bg-[#1B4B8A] text-white font-semibold text-sm hover:bg-[#1E40AF] transition-colors"
            >
              Về trung tâm quản lý fanpage
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {/* Top Back Navigation (Figma: Điều hướng bước [1200x20]) */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/staff/fanpages')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] dark:text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại chọn fanpage</span>
          </button>
        </div>

        {/* Lưu ý xét duyệt banner (Figma: Lưu ý xét duyệt [1200x76]) */}
        <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-xs text-left">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-[#0B1626] dark:text-foreground">
              Fanpage chỉ được kích hoạt sau khi hồ sơ được phê duyệt
            </h3>
            <p className="text-xs text-[#4B5563] dark:text-muted-foreground leading-relaxed">
              Ban Truyền thông & Quản trị hệ thống CTU sẽ thẩm định thông tin, đơn vị quản lý và minh chứng trong 03 ngày làm việc.
            </p>
          </div>
        </div>

        {/* Main Form Card (Figma: Phiếu đăng ký [1200x1372]) */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Header Title & Subtitle */}
          <div className="pb-6 border-b border-[#F3F4F6] dark:border-border">
            <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
              Đăng ký thành lập fanpage mới
            </h1>
            <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-2 leading-relaxed">
              Cung cấp thông tin chính xác để fanpage được định danh trên Cổng sự kiện CTU và sẵn sàng quản lý sự kiện sau khi phê duyệt.
            </p>
          </div>

          {/* Quy trình xét duyệt (Steppers: 01, 02, 03) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F9FAFB] dark:bg-background border border-[#E5E7EB] dark:border-border">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <span className="font-k2d font-bold text-xl text-primary shrink-0">01</span>
              <div>
                <p className="text-xs font-bold text-foreground">Tiếp nhận hồ sơ</p>
                <p className="text-[11px] text-muted-foreground">Ngay sau khi gửi</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 md:border-l md:border-[#E5E7EB] md:dark:border-border md:pl-4">
              <span className="font-k2d font-bold text-xl text-primary shrink-0">02</span>
              <div>
                <p className="text-xs font-bold text-foreground">Thẩm định thông tin</p>
                <p className="text-[11px] text-muted-foreground">Trong 03 ngày làm việc</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 md:border-l md:border-[#E5E7EB] md:dark:border-border md:pl-4">
              <span className="font-k2d font-bold text-xl text-primary shrink-0">03</span>
              <div>
                <p className="text-xs font-bold text-foreground">Phê duyệt & kích hoạt</p>
                <p className="text-[11px] text-muted-foreground">Thông báo qua email CTU</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* NHÓM I: THÔNG TIN FANPAGE */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-[#F3F4F6] dark:border-border pb-3">
                <span className="font-k2d font-bold text-base text-primary">I</span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                    Thông tin fanpage
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Thông tin này sẽ hiển thị trên danh sách fanpage và hồ sơ sự kiện công khai.
                  </p>
                </div>
              </div>

              {/* Tên fanpage */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Tên fanpage <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fanpageName}
                  onChange={(e) => setFanpageName(e.target.value)}
                  placeholder="Nhập tên fanpage chính thức"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Nên dùng tên chính thức của khoa, đơn vị hoặc tổ chức trực thuộc CTU.
                </p>
              </div>

              {/* Hàng 2 cột: Loại hình & Khoa quản lý */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Loại hình đơn vị <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {UNIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Khoa / đơn vị quản lý <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={managingUnit}
                    onChange={(e) => setManagingUnit(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {MANAGING_FACULTIES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mô tả fanpage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Mô tả fanpage <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {description.length} / 500 ký tự
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục đích hoạt động của fanpage..."
                  className="w-full p-3.5 rounded-lg border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Minh chứng thành lập / văn bản ủy quyền */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Minh chứng thành lập / văn bản ủy quyền <span className="text-destructive">*</span>
                </label>
                <div className="relative border-2 border-dashed border-[#D1D5DB] dark:border-border rounded-xl p-6 text-center hover:bg-muted/30 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.jpg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Kéo thả tệp vào đây hoặc chọn tệp từ máy tính
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, JPG hoặc PNG • Tối đa 10 MB • Tối đa 05 tệp
                  </p>
                </div>

                {/* Uploaded files preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
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
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NHÓM II: NGƯỜI ĐẠI DIỆN CHỊU TRÁCH NHIỆM */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-[#F3F4F6] dark:border-border pb-3">
                <span className="font-k2d font-bold text-base text-primary">II</span>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                    Người đại diện chịu trách nhiệm
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Thông tin dùng để xác minh hồ sơ và liên hệ khi cần bổ sung nội dung.
                  </p>
                </div>
              </div>

              {/* Tóm tắt người đại diện Card */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-k2d font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                      NMA
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-foreground">
                          {user?.name || 'Nguyễn Minh Anh'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                          Tài khoản đang đăng ký
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vai trò hệ thống: <span className="font-medium text-foreground">Cán bộ</span>
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
                    <button type="button" className="text-primary hover:underline">
                      Xem hồ sơ
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button type="button" className="text-primary hover:underline">
                      Cập nhật hồ sơ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E5E7EB] dark:border-border text-xs">
                  <div>
                    <span className="text-muted-foreground">Loại tài khoản:</span>{' '}
                    <span className="font-medium text-foreground">Cán bộ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium text-foreground">{user?.email || 'minhanh@ctu.edu.vn'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Đơn vị / lớp:</span>{' '}
                    <span className="font-medium text-foreground">Khoa Môi trường và Tài nguyên Thiên nhiên</span>
                  </div>
                </div>
              </div>

              {/* Thông báo vai trò mặc định */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  <span className="font-bold">Admin mặc định:</span> Người tạo fanpage sẽ được mặc định là Admin và có toàn quyền quản lý fanpage sau khi hồ sơ được phê duyệt.
                </p>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-[#E5E7EB] dark:border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                Thông tin chỉ được lưu khi bạn gửi yêu cầu đăng ký.
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/staff/fanpages')}
                  className="w-full sm:w-auto px-6 h-11 rounded-lg border border-[#D1D5DB] dark:border-border text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted font-medium text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 h-11 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
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
