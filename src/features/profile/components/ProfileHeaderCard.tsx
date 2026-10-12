import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface ProfileHeaderCardProps {
  profile: StudentProfile
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-6">
      {/* Big Circular Avatar Placeholder */}
      <div className="relative shrink-0">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border border-border/80 shadow-inner"
          />
        ) : (
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-border/80 flex items-center justify-center text-3xl font-bold text-muted-foreground shadow-inner">
            {profile.fullName.charAt(0)}
          </div>
        )}
      </div>

      {/* Info: Name, Status Badge, Student Meta */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <h1 className="font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
            {profile.fullName}
          </h1>
          <span className="inline-flex items-center rounded-full bg-muted/90 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
            {profile.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1 text-sm font-medium text-muted-foreground pt-1">
          <span>
            MSSV: <strong className="text-foreground">{profile.studentId}</strong>
          </span>
          <span>
            Lớp: <strong className="text-foreground">{profile.classId}</strong>
          </span>
          <span>
            Khoá: <strong className="text-foreground">{profile.cohort}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
