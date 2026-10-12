import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface PersonalInfoCardProps {
  profile: StudentProfile
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ profile }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
      <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
        I. THÔNG TIN CÁ NHÂN
      </h2>

      {/* 2-Column Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Họ và tên</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.fullName}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Ngày sinh</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.dateOfBirth}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Giới tính</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.gender}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">MSSV</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.studentId}
          </span>
        </div>
      </div>

      {/* Bio / Description */}
      <div className="flex flex-col gap-1 pt-2 border-t border-border/60">
        <span className="text-xs text-muted-foreground font-medium">Mô tả bản thân</span>
        <p className="text-sm text-foreground/90 leading-relaxed font-normal">
          {profile.bio}
        </p>
      </div>
    </div>
  )
}
