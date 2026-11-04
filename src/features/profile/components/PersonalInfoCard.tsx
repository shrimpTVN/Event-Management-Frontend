import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface PersonalInfoCardProps {
  profile: StudentProfile
  isEditing?: boolean
  formData?: StudentProfile | null
  onChange?: (fields: Partial<StudentProfile>) => void
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  profile,
  isEditing = false,
  formData,
  onChange,
}) => {
  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col gap-5 transition-all">
      {/* Card Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-[#1B4B8A] dark:text-primary tracking-normal uppercase">
          THÔNG TIN CÁ NHÂN
        </h2>
        {isEditing && (
          <span className="text-xs font-normal text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
            Đang chỉnh sửa
          </span>
        )}
      </div>

      {/* 2-Column Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Họ và tên */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Họ và tên
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData?.fullName ?? ''}
              onChange={(e) => onChange?.({ fullName: e.target.value })}
              placeholder="Nhập họ và tên đầy đủ"
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          ) : (
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.fullName || 'Chưa cập nhật'}
            </span>
          )}
        </div>

        {/* Giới tính */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Giới tính
          </label>
          {isEditing ? (
            <select
              value={formData?.gender ?? 'Nam'}
              onChange={(e) =>
                onChange?.({ gender: e.target.value as 'Nam' | 'Nữ' | 'Khác' })
              }
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          ) : (
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.gender || 'Chưa cập nhật'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
