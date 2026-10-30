import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  Save,
  Upload,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FanpageSummary } from '../types/fanpageAdmin.types'
import { fanpageAdminService } from '../services/fanpageAdminService'

interface FanpageProfileEditViewProps {
  currentFanpage: FanpageSummary
  onSave?: (updated: Partial<FanpageSummary>) => void
  onCancel?: () => void
}

export const FanpageProfileEditView: React.FC<FanpageProfileEditViewProps> = ({
  currentFanpage,
  onSave,
  onCancel,
}) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit toggle mode: Default is disabled (view-only)
  const [isEditing, setIsEditing] = useState(false)

  // 1. Fetch real fanpage detail
  const { data: detailData } = useQuery<FanpageSummary | null>({
    queryKey: ['fanpage-detail', currentFanpage.id],
    queryFn: () => fanpageAdminService.getFanpageDetail(currentFanpage.id),
    initialData: currentFanpage,
  })

  const effectiveFanpage = detailData || currentFanpage

  // 2. Form state initialized from real data
  const [name, setName] = useState(effectiveFanpage.name || '')
  const [fullName, setFullName] = useState(effectiveFanpage.fullName || '')
  const [code, setCode] = useState(effectiveFanpage.code || '')
  const [parentOrg, setParentOrg] = useState(
    effectiveFanpage.parentOrg || 'Đoàn Thanh niên Đại học Cần Thơ'
  )
  const [orgType, setOrgType] = useState(effectiveFanpage.orgType || 'Đoàn Khoa / Trường')
  const [email, setEmail] = useState(effectiveFanpage.email || '')
  const [phone, setPhone] = useState(effectiveFanpage.phone || '')
  const [address, setAddress] = useState(effectiveFanpage.address || 'Khu II, Đại học Cần Thơ')
  const [description, setDescription] = useState(effectiveFanpage.description || '')
  const [avatarUrl, setAvatarUrl] = useState(effectiveFanpage.avatarUrl || '')

  // Reset helper
  const resetFormValues = (src: FanpageSummary) => {
    setName(src.name || '')
    setFullName(src.fullName || '')
    setCode(src.code || '')
    setParentOrg(src.parentOrg || 'Đoàn Thanh niên Đại học Cần Thơ')
    setOrgType(src.orgType || 'Đoàn Khoa / Trường')
    setEmail(src.email || '')
    setPhone(src.phone || '')
    setAddress(src.address || 'Khu II, Đại học Cần Thơ')
    setDescription(src.description || '')
    setAvatarUrl(src.avatarUrl || '')
  }

  // Sync state if detailData loads/changes
  useEffect(() => {
    if (detailData) {
      resetFormValues(detailData)
    }
  }, [detailData])

  // 3. Feedback message state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // 4. Save mutation
  const updateMutation = useMutation({
    mutationFn: (updatedPayload: Partial<FanpageSummary>) =>
      fanpageAdminService.updateFanpageProfile(currentFanpage.id, updatedPayload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fanpage-detail', currentFanpage.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
      queryClient.invalidateQueries({ queryKey: ['admin-fanpages'] })
      setIsEditing(false)
      setFeedback({
        type: 'success',
        message: 'Cập nhật thông tin fanpage thành công!',
      })
      onSave?.(data || {})
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: () => {
      setFeedback({
        type: 'error',
        message: 'Lưu thay đổi thất bại, vui lòng thử lại.',
      })
    },
  })

  // 5. Handle Real File Upload for Avatar (Live Preview)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing) return

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Tên fanpage không được để trống' })
      return
    }

    updateMutation.mutate({
      name,
      fullName,
      code,
      parentOrg,
      orgType,
      email,
      phone,
      address,
      description,
      avatarUrl,
    })
  }

  const handleCancelEdit = () => {
    resetFormValues(effectiveFanpage)
    setIsEditing(false)
    setFeedback(null)
    onCancel?.()
  }

  return (
    <form onSubmit={handleFormSubmit} className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị fanpage</span>
            <span>/</span>
            <span className="text-primary font-bold">Thông tin fanpage</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Thông tin fanpage ({effectiveFanpage.name})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hồ sơ công khai, đơn vị chủ quản và các kênh liên lạc hỗ trợ sinh viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-9 rounded-lg gap-2 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Chỉnh sửa thông tin</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="h-9 rounded-lg gap-1.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Hủy bỏ</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="h-9 rounded-lg gap-2 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
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

      {/* 2. Balanced 2-Column Grid Layout (Rule 5.2 & Rule 5.3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* ================= CARD 1: NHẬN DIỆN & LOGO (Col 1) ================= */}
        <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Nhận diện & Tên fanpage</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Biểu trưng và thông tin đại diện của đơn vị
              </p>
            </div>
          </div>

          {/* Logo Circular Upload with Live Preview */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border">
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-primary text-white font-k2d font-bold text-lg flex items-center justify-center">
                  {code || 'FP'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={!isEditing}
                onChange={handleFileChange}
              />
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 rounded-lg text-xs gap-1.5 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải ảnh từ máy</span>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">
                  Ảnh đại diện chính thức
                </span>
              )}
              <p className="text-[11px] text-muted-foreground">
                Hỗ trợ định dạng PNG, JPG, WEBP.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fp-name" className="text-xs font-semibold">
                Tên hiển thị fanpage <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fp-name"
                value={name}
                disabled={!isEditing}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Đoàn Trường CNTT & TT"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-code" className="text-xs font-semibold">
                Mã viết tắt
              </Label>
              <Input
                id="fp-code"
                value={code}
                disabled={!isEditing}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: CNTT"
                className="h-10 text-xs rounded-lg font-mono uppercase placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ================= CARD 2: PHÁP NHÂN & ĐƠN VỊ CHỦ QUẢN (Col 2) ================= */}
        <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Pháp nhân & Đơn vị chủ quản</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cơ quan quản lý và mô hình tổ chức trực thuộc
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fp-fullname" className="text-xs font-semibold">
                Tên đầy đủ của tổ chức
              </Label>
              <Input
                id="fp-fullname"
                value={fullName}
                disabled={!isEditing}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Đoàn Trường Công nghệ Thông tin & Truyền thông"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-parent" className="text-xs font-semibold">
                Đơn vị chủ quản cấp trên
              </Label>
              <Input
                id="fp-parent"
                value={parentOrg}
                disabled={!isEditing}
                onChange={(e) => setParentOrg(e.target.value)}
                placeholder="VD: Đoàn Thanh niên Đại học Cần Thơ"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-orgtype" className="text-xs font-semibold">
                Loại hình tổ chức
              </Label>
              <Select
                value={orgType}
                disabled={!isEditing}
                onValueChange={(val) => setOrgType(val)}
              >
                <SelectTrigger
                  id="fp-orgtype"
                  className="h-10 text-xs rounded-lg disabled:bg-muted/40 disabled:cursor-not-allowed"
                >
                  <SelectValue placeholder="Chọn loại hình tổ chức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Đoàn Khoa / Trường">Đoàn Khoa / Trường</SelectItem>
                  <SelectItem value="Hội Sinh viên">Hội Sinh viên</SelectItem>
                  <SelectItem value="Câu lạc bộ học thuật">Câu lạc bộ học thuật</SelectItem>
                  <SelectItem value="Đội nhóm tình nguyện">Đội nhóm tình nguyện</SelectItem>
                  <SelectItem value="Phòng ban chức năng">Phòng ban chức năng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ================= CARD 3: THÔNG TIN LIÊN HỆ & ĐỊA ĐIỂM (md:col-span-2) ================= */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Kênh liên hệ & Địa điểm hỗ trợ</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kênh tiếp nhận thắc mắc và hỗ trợ sinh viên tham gia sự kiện
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fp-email" className="text-xs font-semibold">
                Email hỗ trợ <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fp-email"
                type="email"
                value={email}
                disabled={!isEditing}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@ctu.edu.vn"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-phone" className="text-xs font-semibold">
                Số điện thoại liên hệ
              </Label>
              <Input
                id="fp-phone"
                type="tel"
                value={phone}
                disabled={!isEditing}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-address" className="text-xs font-semibold">
                Văn phòng / Khu vực làm việc
              </Label>
              <Input
                id="fp-address"
                value={address}
                disabled={!isEditing}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Khu II, Đại học Cần Thơ"
                className="h-10 text-xs rounded-lg placeholder:text-muted-foreground/60 disabled:bg-muted/40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ================= CARD 4: MÔ TẢ HOẠT ĐỘNG (md:col-span-2) ================= */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-5 shadow-2xs">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Giới thiệu & Mô tả hoạt động</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiển thị trên phần giới thiệu trang chi tiết fanpage
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Textarea
              id="fp-desc"
              rows={4}
              value={description}
              disabled={!isEditing}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu về mục tiêu, các sự kiện tiêu biểu và tôn chỉ hoạt động của fanpage..."
              className="text-xs rounded-lg placeholder:text-muted-foreground/60 leading-relaxed resize-y disabled:bg-muted/40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

      </div>
    </form>
  )
}
