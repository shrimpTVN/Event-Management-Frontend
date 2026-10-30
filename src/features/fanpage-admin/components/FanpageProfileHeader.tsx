import React from 'react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
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
    <div className="w-full bg-white dark:bg-card border border-border/50 dark:border-border/60 rounded-xl p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5 sm:gap-6 text-left">
      {/* Left: Avatar + Fanpage Name + Stats */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 min-w-0 text-center sm:text-left">
        {/* Fanpage Avatar - Circular 96px */}
        <div className="relative shrink-0">
          {fanpage.avatarUrl ? (
            <img
              src={fanpage.avatarUrl}
              alt={fanpage.fullName || fanpage.name}
              className="h-24 w-24 rounded-full object-cover border-2 border-border/80 shadow-2xs p-0.5 bg-white dark:bg-card"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#1B4B8A] to-[#2563EB] text-white font-k2d font-bold text-2xl flex items-center justify-center shrink-0 border-2 border-border/80 shadow-2xs p-0.5">
              {fanpage.avatarText || 'CTU'}
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0">
          <h1 className="font-k2d font-bold text-xl sm:text-2xl text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span>{fanpage.fullName || fanpage.name}</span>
            <VerifiedBadge className="h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0" />
          </h1>

          <div className="flex items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-muted-foreground mt-1.5">
            <div>
              <span className="font-semibold text-foreground">
                {fanpage.followersCount.toLocaleString('vi-VN')}
              </span>{' '}
              <span>người theo dõi</span>
            </div>
            <span>•</span>
            <div>
              <span className="font-semibold text-foreground">{fanpage.eventsCount}</span>{' '}
              <span>sự kiện</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions (Horizontal row matching student side layout) */}
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
