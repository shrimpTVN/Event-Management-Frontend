import React, { useState, useRef } from 'react'
import { SquarePen, X, Check, Loader2, Camera, Upload, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { mediaService } from '@/shared/services/mediaService'
import type { StudentProfile } from '../types/profile.types'

interface ProfileHeaderCardProps {
  profile: StudentProfile
  isEditing?: boolean
  formData?: StudentProfile | null
  onChange?: (fields: Partial<StudentProfile>) => void
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  isSaving?: boolean
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  isEditing = false,
  formData,
  onChange,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const currentAvatar = (isEditing && formData ? formData.avatarUrl : profile.avatarUrl) || ''
  const currentFullName = (isEditing && formData ? formData.fullName : profile.fullName) || ''
  const currentCohort = (isEditing && formData ? formData.cohort : profile.cohort) || ''
  const currentClassId = (isEditing && formData ? formData.classId : profile.classId) || ''

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
      onChange?.({ avatarUrl: secureUrl })
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
    if (!isEditing && onEdit) {
      onEdit()
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
      {/* Hidden file input for Cloudinary upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Left section: Avatar + Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 min-w-0 w-full sm:w-auto">
        {/* Circular Avatar 84x84px with Upload Camera Overlay */}
        <div className="relative shrink-0 group">
          <div
            onClick={isEditing ? triggerUpload : undefined}
            className={`h-20 w-20 min-w-20 min-h-20 sm:h-22 sm:w-22 sm:min-w-22 sm:min-h-22 rounded-full overflow-hidden border-2 border-border/80 shadow-sm relative ${
              isEditing ? 'cursor-pointer hover:border-primary transition-all' : ''
            }`}
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={currentFullName || 'Avatar'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-muted-foreground shadow-inner">
                {(currentFullName || 'U').charAt(0)}
              </div>
            )}

            {/* Uploading loading spinner overlay */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1 z-20">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-[9px] font-semibold">Tải lên...</span>
              </div>
            )}

            {/* Hover overlay in edit mode */}
            {isEditing && !isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-10">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-semibold mt-0.5">Đổi ảnh</span>
              </div>
            )}
          </div>

          {/* Quick Upload action button pinned to bottom-right of avatar */}
          <button
            type="button"
            onClick={triggerUpload}
            disabled={isUploadingAvatar}
            title="Tải ảnh đại diện lên Cloudinary"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors border-2 border-background"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Info Stack */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 min-w-0 flex-1">
          {/* Avatar Upload Actions & Feedback in Edit Mode */}
          {isEditing && (
            <div className="flex flex-col sm:items-start items-center gap-1.5 w-full max-w-md">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={triggerUpload}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải ảnh từ máy (Cloudinary)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <LinkIcon className="h-3 w-3" />
                  <span>{showUrlInput ? 'Ẩn nhập URL' : 'Hoặc nhập link URL'}</span>
                </button>
              </div>

              {/* Direct URL input if toggled */}
              {showUrlInput && (
                <div className="w-full">
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/..."
                    value={formData?.avatarUrl || ''}
                    onChange={(e) => onChange?.({ avatarUrl: e.target.value })}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Upload Error feedback */}
              {uploadError && (
                <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>
          )}

          {/* Name & Status Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="font-k2d font-semibold text-2xl sm:text-[34px] leading-tight sm:leading-[44px] text-[#111827] dark:text-foreground tracking-tight">
              {currentFullName || 'Chưa cập nhật họ tên'}
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#ECFBFF] dark:bg-[#065C85]/20 px-2.5 py-1 text-xs font-semibold text-[#065C85] dark:text-[#38BDF8] leading-[15px]">
              {profile.status}
            </span>
          </div>

          {/* Key Meta Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1.5 text-sm font-normal text-[#4B5563] dark:text-muted-foreground">
            <span>MSSV: {profile.studentId || 'Chưa cập nhật'}</span>
            <span>Lớp: {currentClassId || 'Chưa cập nhật'}</span>
            <span>Khoá: {currentCohort || 'Chưa cập nhật'}</span>
          </div>
        </div>
      </div>

      {/* Right section: Action button */}
      <div className="shrink-0 self-center sm:self-auto flex items-center gap-3">
        {!isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <SquarePen className="h-4 w-4" />
            <span>Cập nhật</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving || isUploadingAvatar}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Hủy</span>
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isUploadingAvatar}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white px-4 py-2 text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
