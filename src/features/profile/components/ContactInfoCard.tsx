import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface ContactInfoCardProps {
  profile: StudentProfile
  isEditing?: boolean
  formData?: StudentProfile | null
  onChange?: (fields: Partial<StudentProfile>) => void
  onAddPhone?: () => void
}

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
  profile,
  isEditing = false,
  formData,
  onChange,
  onAddPhone,
}) => {
  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col gap-5 transition-all">
      {/* Card Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-[#1B4B8A] dark:text-primary tracking-normal uppercase">
          THÔNG TIN LIÊN HỆ
        </h2>
        {isEditing && (
          <span className="text-xs font-normal text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
            Đang chỉnh sửa
          </span>
        )}
      </div>

      {/* 2-Column Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Số điện thoại cá nhân */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Số điện thoại cá nhân
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData?.phoneNumber ?? ''}
              onChange={(e) => onChange?.({ phoneNumber: e.target.value })}
              placeholder="VD: 0912345678"
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          ) : profile.phoneNumber ? (
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.phoneNumber}
            </span>
          ) : (
            <div className="flex items-center gap-2.5 text-base leading-6">
              <span className="text-[#9CA3AF] dark:text-muted-foreground font-normal">
                Chưa cập nhật.
              </span>
              <button
                type="button"
                onClick={onAddPhone}
                className="text-[#008CCC] hover:text-[#0077B3] dark:text-[#38BDF8] font-normal cursor-pointer hover:underline p-0 m-0 bg-transparent border-0"
              >
                Thêm
              </button>
            </div>
          )}
        </div>

        {/* Email sinh viên */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Email sinh viên
          </label>
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
              <span className="text-[11px] text-muted-foreground">
                Email trường cấp cố định, không thể chỉnh sửa.
              </span>
            </div>
          ) : (
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6 break-all">
              {profile.email}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
