import React from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import type { FanpageSummary } from '../types/fanpageAdmin.types'

interface FanpageAboutCardProps {
  fanpage: FanpageSummary
  onEditClick?: () => void
}

export const FanpageAboutCard: React.FC<FanpageAboutCardProps> = ({ fanpage, onEditClick }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-5 shadow-xs space-y-3.5 text-left">
      {/* Header with edit link */}
      <div className="flex items-center justify-between">
        <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground">
          Giới thiệu
        </h3>
        <button
          type="button"
          onClick={onEditClick}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-[#4B5563] dark:text-muted-foreground leading-relaxed">
        {fanpage.description}
      </p>

      {/* Contact Lines */}
      <div className="space-y-2.5 pt-2 border-t border-[#F3F4F6] dark:border-border text-xs">
        <div className="flex items-center gap-2.5 text-[#4B5563] dark:text-muted-foreground">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate select-all">{fanpage.email}</span>
        </div>

        <div className="flex items-center gap-2.5 text-[#4B5563] dark:text-muted-foreground">
          <Phone className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{fanpage.phone}</span>
        </div>

        <div className="flex items-start gap-2.5 text-[#4B5563] dark:text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span className="leading-snug">{fanpage.address}</span>
        </div>
      </div>
    </div>
  )
}
