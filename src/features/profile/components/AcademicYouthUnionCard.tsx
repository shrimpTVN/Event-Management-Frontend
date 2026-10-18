import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface AcademicYouthUnionCardProps {
  profile: StudentProfile
}

export const AcademicYouthUnionCard: React.FC<AcademicYouthUnionCardProps> = ({ profile }) => {
  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col gap-5">
      {/* Card Section Header */}
      <h2 className="text-base font-medium text-[#1B4B8A] dark:text-primary tracking-normal uppercase">
        THÔNG TIN HỌC TẬP & ĐOÀN HỘI
      </h2>

      {/* Fields Stack: 3 Rows separated by 24px */}
      <div className="flex flex-col gap-6">
        {/* Row 1: MSSV & Khóa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              MSSV
            </span>
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.studentId}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Khóa
            </span>
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.cohort}
            </span>
          </div>
        </div>

        {/* Row 2: Lớp sinh hoạt (Full width) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Lớp sinh hoạt
          </span>
          <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
            {profile.classId}
          </span>
        </div>

        {/* Row 3: Ngành học & Khoa / Trường thành viên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Ngành học
            </span>
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.major}
              {profile.majorCode ? ` (Mã ngành: ${profile.majorCode})` : ''}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
              Khoa / Trường thành viên
            </span>
            <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
              {profile.faculty}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

