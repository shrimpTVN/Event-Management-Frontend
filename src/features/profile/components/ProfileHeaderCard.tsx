import React, { useState } from 'react'
import { SquarePen, X, Check, Loader2, Camera } from 'lucide-react'
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
  const [showAvatarInput, setShowAvatarInput] = useState(false)
  const currentAvatar = (isEditing && formData ? formData.avatarUrl : profile.avatarUrl) || ''
  const currentFullName = (isEditing && formData ? formData.fullName : profile.fullName) || ''
  const currentCohort = (isEditing && formData ? formData.cohort : profile.cohort) || ''
  const currentClassId = (isEditing && formData ? formData.classId : profile.classId) || ''

  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
      {/* Left section: Avatar + Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 min-w-0 w-full sm:w-auto">
        {/* Circular Avatar 80x80px */}
        <div className="relative shrink-0 group">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={currentFullName || 'Avatar'}
              className="h-20 w-20 min-w-20 min-h-20 rounded-full object-cover border border-border/80 shadow-sm"
            />
          ) : (
            <div className="h-20 w-20 min-w-20 min-h-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center text-2xl font-bold text-muted-foreground shadow-inner">
              {(currentFullName || 'U').charAt(0)}
            </div>
          )}

          {/* Edit Avatar button in edit mode */}
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowAvatarInput(!showAvatarInput)}
              title="Đổi URL ảnh đại diện"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#1B365D] hover:bg-[#1B4B8A] text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Info Stack */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5 min-w-0 flex-1">
          {/* Inline Avatar URL input in edit mode */}
          {isEditing && showAvatarInput && (
            <div className="w-full max-w-sm mb-1">
              <input
                type="url"
                placeholder="Nhập link ảnh (URL)..."
                value={formData?.avatarUrl || ''}
                onChange={(e) => onChange?.({ avatarUrl: e.target.value })}
                className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
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
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Hủy</span>
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
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
