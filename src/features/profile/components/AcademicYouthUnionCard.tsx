import React from 'react'
import type { StudentProfile } from '../types/profile.types'

interface AcademicYouthUnionCardProps {
  profile: StudentProfile
}

export const AcademicYouthUnionCard: React.FC<AcademicYouthUnionCardProps> = ({ profile }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6">
      <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
        III. THÔNG TIN HỌC TẬP & ĐOÀN HỘI
      </h2>

      <div className="flex flex-col gap-5 text-sm">
        {/* Khoa / Trường thành viên */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            Khoa / Trường thành viên
          </span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.faculty}
          </span>
        </div>

        {/* Ngành học */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">Ngành học</span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.major} {profile.majorCode ? `(Mã ngành: ${profile.majorCode})` : ''}
          </span>
        </div>

        {/* Lớp sinh hoạt & Chương trình đào tạo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Lớp sinh hoạt</span>
            <span className="font-semibold text-foreground text-sm sm:text-base">
              {profile.classId}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Chương trình đào tạo</span>
            <span className="font-semibold text-foreground text-sm sm:text-base">
              {profile.academicProgram}
            </span>
          </div>
        </div>

        {/* Chi hội Sinh viên trực thuộc */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            Chi hội Sinh viên trực thuộc
          </span>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            {profile.youthUnionBranch}
          </span>
        </div>
      </div>
    </div>
  )
}
