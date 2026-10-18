import React from 'react'
import { CheckCircle2, Users, Calendar } from 'lucide-react'
import type { FanpageSummary } from '../types/fanpageAdmin.types'

interface FanpageProfileHeaderProps {
  fanpage: FanpageSummary
  actions?: React.ReactNode
}

export const FanpageProfileHeader: React.FC<FanpageProfileHeaderProps> = ({
  fanpage,
  actions,
}) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-5 sm:p-6 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0 flex-1">
          {/* Fanpage Avatar (82x82 rounded-2xl) */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#1B4B8A] to-[#2563EB] text-white font-k2d font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm border-2 border-white dark:border-card">
            {fanpage.avatarText || 'CTU'}
          </div>

          {/* Fanpage Main Information */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Tên và Đã xác nhận cùng hàng */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <h2 className="font-k2d font-bold text-base sm:text-lg lg:text-xl text-[#0B1626] dark:text-foreground tracking-tight leading-snug">
                {fanpage.fullName}
              </h2>

              {fanpage.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Đã xác nhận</span>
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-primary">
              {fanpage.email}
            </p>

            <div className="flex items-center gap-4 text-xs text-[#5B6675] dark:text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  <strong className="text-foreground">{fanpage.followersCount.toLocaleString('vi-VN')}</strong> người theo dõi
                </span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  <strong className="text-foreground">{fanpage.eventsCount}</strong> sự kiện
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Cột nút thao tác xếp dọc */}
        {actions && (
          <div className="flex flex-col gap-2 shrink-0 self-stretch sm:self-center w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
