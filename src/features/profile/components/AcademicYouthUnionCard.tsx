import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface AcademicYouthUnionCardProps {
  profile: StudentProfile
  isEditing?: boolean
  formData?: StudentProfile | null
  onChange?: (fields: Partial<StudentProfile>) => void
}

export const AcademicYouthUnionCard: React.FC<AcademicYouthUnionCardProps> = ({
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
          THÔNG TIN HỌC TẬP & ĐOÀN HỘI
        </h2>
        {isEditing && (
          <span className="text-xs font-normal text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
            Đang chỉnh sửa
          </span>
        )}
      </div>

      {/* Fields Stack: 3 Rows separated by 24px */}
      <div className="flex flex-col gap-6">
        {/* Row 1: MSSV & Khóa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              MSSV
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.studentId}
                disabled
                className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            ) : (
              <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
                {profile.studentId || 'Chưa cập nhật'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Khóa
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData?.cohort ?? profile.cohort}
                disabled
                className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            ) : (
              <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
                {profile.cohort || 'Chưa cập nhật'}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Lớp sinh hoạt (Full width) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Lớp sinh hoạt
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData?.classId ?? ''}
              onChange={(e) => onChange?.({ classId: e.target.value })}
              placeholder="VD: DI2396A1"
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          ) : (
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.classId || 'Chưa cập nhật'}
            </span>
          )}
        </div>

        {/* Row 3: Ngành học & Khoa / Trường thành viên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Ngành học
            </label>
            {isEditing ? (
              <input
                type="text"
                value={`${profile.major || ''}${profile.majorCode ? ` (Mã ngành: ${profile.majorCode})` : ''}`}
                disabled
                className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            ) : (
              <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
                {profile.major || 'Chưa cập nhật'}
                {profile.majorCode ? ` (Mã ngành: ${profile.majorCode})` : ''}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Khoa / Trường thành viên
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.faculty || ''}
                disabled
                className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              />
            ) : (
              <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
                {profile.faculty || 'Chưa cập nhật'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
