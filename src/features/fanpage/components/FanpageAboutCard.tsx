import React from 'react'
import type { FanpageDetail } from '../types/fanpage.types'

interface FanpageAboutCardProps {
  fanpage: FanpageDetail
}

export const FanpageAboutCard: React.FC<FanpageAboutCardProps> = ({ fanpage }) => {
  return (
    <div className="w-full bg-white dark:bg-card border border-border/80 rounded-xl p-5 shadow-2xs space-y-4 text-left">
      {/* Title */}
      <h2 className="font-k2d font-medium text-lg text-foreground tracking-tight border-b border-border/50 pb-2">
        Giới thiệu
      </h2>

      {/* Email */}
      <div className="space-y-1">
        <div className="font-medium text-xs text-foreground">Email</div>
        <a
          href={`mailto:${fanpage.email}`}
          className="text-xs text-muted-foreground hover:text-primary hover:underline break-all transition-colors block"
        >
          {fanpage.email}
        </a>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <div className="font-medium text-xs text-foreground">Mô tả</div>
        <p className="text-xs leading-relaxed text-[#4B5563] dark:text-muted-foreground whitespace-pre-line">
          {fanpage.description}
        </p>
      </div>
    </div>
  )
}
