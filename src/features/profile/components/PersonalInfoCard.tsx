import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface PersonalInfoCardProps {
  profile: StudentProfile
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ profile }) => {
  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col gap-5">
      {/* Card Section Header */}
      <h2 className="text-base font-medium text-[#1B4B8A] dark:text-primary tracking-normal uppercase">
        THÔNG TIN CÁ NHÂN
      </h2>

      {/* 2-Column Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Họ và tên */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Họ và tên
          </span>
          <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
            {profile.fullName}
          </span>
        </div>

        {/* Giới tính */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#6B7280] dark:text-muted-foreground leading-5">
            Giới tính
          </span>
          <span className="text-base font-normal text-[#111827] dark:text-foreground leading-6">
            {profile.gender}
          </span>
        </div>
      </div>
    </div>
  )
}

