import React, { useState, useEffect, useRef } from 'react'
import { X, User, Phone, Image as ImageIcon, Upload, Loader2, AlertCircle, Camera } from 'lucide-react'
import { mediaService } from '@/shared/services/mediaService'
import type { StudentProfile } from '../types/profile.types'

interface EditProfileModalProps {
  isOpen: boolean
  profile: StudentProfile
  onClose: () => void
  onSave: (updatedProfile: StudentProfile) => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<StudentProfile>(profile)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData(profile)
      setUploadError(null)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh tối đa là 5MB')
      return
    }

    try {
      setIsUploadingAvatar(true)
      setUploadError(null)
      const secureUrl = await mediaService.uploadImage(file, 'AVATAR')
      setFormData((prev) => ({ ...prev, avatarUrl: secureUrl }))
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh đại diện lên Cloudinary:', err)
      setUploadError(err?.message || 'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-5 custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-[#111827] dark:text-foreground">
            Cập nhật hồ sơ sinh viên
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          {/* Avatar Preview & Cloudinary Upload */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 group">
                <div
                  onClick={triggerUpload}
                  className="h-16 w-16 rounded-full overflow-hidden border-2 border-border cursor-pointer relative"
                  title="Nhấn để tải ảnh đại diện lên"
                >
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.fullName || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-muted-foreground">
                      <User className="h-7 w-7" />
                    </div>
                  )}

                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-0.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[8px] font-medium">Tải...</span>
                    </div>
                  )}

                  {!isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={triggerUpload}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors border border-background"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerUpload}
                    disabled={isUploadingAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Tải ảnh từ máy (Cloudinary)</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    placeholder="Hoặc nhập link URL ảnh..."
                    value={formData.avatarUrl || ''}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 pl-8 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  <ImageIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}
          </div>

          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
                Số điện thoại cá nhân
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 pl-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' | 'Khác' })
                }
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Read-only synchronized fields banner */}
          <div className="rounded-lg bg-[#EFF5FC] dark:bg-[#162E4F]/60 border border-[#DBEAFE] dark:border-[#1E40AF]/40 p-3.5 text-xs text-[#1E40AF] dark:text-[#93C5FD] flex flex-col gap-1">
            <span className="font-semibold">Thông tin học vụ đồng bộ từ hệ thống:</span>
            <span>
              MSSV: <strong>{profile.studentId || 'Chưa cập nhật'}</strong> — Lớp: <strong>{profile.classId || 'Chưa cập nhật'}</strong> — {profile.major || 'Chưa cập nhật'}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
