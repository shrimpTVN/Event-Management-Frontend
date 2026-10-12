import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface ContactInfoCardProps {
  profile: StudentProfile
}

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ profile }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
      <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
        II. THÔNG TIN LIÊN HỆ
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Số điện thoại cá nhân</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.phoneNumber}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Email sinh viên</span>
          <span className="font-semibold text-foreground text-sm sm:text-base break-all">
            {profile.email}
          </span>
        </div>
      </div>
    </div>
  )
}
