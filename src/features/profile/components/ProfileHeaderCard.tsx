import React from 'react'
import { SquarePen } from 'lucide-react'
import type { StudentProfile } from '../types/profile.types'

interface ProfileHeaderCardProps {
  profile: StudentProfile
  onEdit?: () => void
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile, onEdit }) => {
  return (
    <div className="w-full max-w-[1112px] rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Left section: Avatar + Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 min-w-0">
        {/* Circular Avatar 80x80px */}
        <div className="relative shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-20 w-20 min-w-20 min-h-20 rounded-full object-cover border border-border/80 shadow-sm"
            />
          ) : (
            <div className="h-20 w-20 min-w-20 min-h-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center text-2xl font-bold text-muted-foreground shadow-inner">
              {profile.fullName.charAt(0)}
            </div>
          )}
        </div>

        {/* Info Stack */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5 min-w-0">
          {/* Name & Status Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="font-k2d font-semibold text-2xl sm:text-[34px] leading-tight sm:leading-[44px] text-[#111827] dark:text-foreground tracking-tight">
              {profile.fullName}
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#ECFBFF] dark:bg-[#065C85]/20 px-2.5 py-1 text-xs font-semibold text-[#065C85] dark:text-[#38BDF8] leading-[15px]">
              {profile.status}
            </span>
          </div>

          {/* Key Meta Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1.5 text-sm font-normal text-[#4B5563] dark:text-muted-foreground">
            <span>MSSV: {profile.studentId}</span>
            <span>Lớp: {profile.classId}</span>
            <span>Khoá: {profile.cohort}</span>
          </div>
        </div>
      </div>

      {/* Right section: Action button */}
      <div className="shrink-0 self-center sm:self-auto">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <SquarePen className="h-4 w-4" />
          <span>Cập nhật</span>
        </button>
      </div>
    </div>
  )
}

