import React from 'react'
import { Mail, Phone, MapPin, Building2, ShieldCheck } from 'lucide-react'
import type { FanpageSummary } from '../types/fanpageAdmin.types'

interface FanpageAboutCardProps {
  fanpage: FanpageSummary
  onEditClick?: () => void
}

export const FanpageAboutCard: React.FC<FanpageAboutCardProps> = ({ fanpage, onEditClick }) => {
  return (
    <div className="w-full bg-white dark:bg-card border border-border/50 dark:border-border/60 rounded-xl p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] space-y-3.5 text-left">
      {/* Header with edit link */}
      <div className="flex items-center justify-between">
        <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground tracking-tight">
          Giới thiệu
        </h3>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Description / Bio */}
      {fanpage.description && (
        <p className="text-xs leading-relaxed text-[#4B5563] dark:text-muted-foreground whitespace-pre-line">
          {fanpage.description}
        </p>
      )}

      {/* Contact & Organization Lines */}
      <div className="space-y-3 pt-3 border-t border-border/60 text-xs">
        {/* Full Org Name */}
        {fanpage.fullName && fanpage.fullName !== fanpage.name && (
          <div className="flex items-start gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-foreground font-medium">Đơn vị: </strong>
              {fanpage.fullName}
            </span>
          </div>
        )}

        {/* Parent Org */}
        {fanpage.parentOrg && (
          <div className="flex items-start gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-foreground font-medium">Trực thuộc: </strong>
              {fanpage.parentOrg}
            </span>
          </div>
        )}

        {/* Email */}
        {fanpage.email && (
          <div className="flex items-center gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <a
              href={`mailto:${fanpage.email}`}
              className="hover:text-primary hover:underline truncate select-all transition-colors"
            >
              {fanpage.email}
            </a>
          </div>
        )}

        {/* Phone */}
        {fanpage.phone && (
          <div className="flex items-center gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span>{fanpage.phone}</span>
          </div>
        )}

        {/* Address */}
        {fanpage.address && (
          <div className="flex items-start gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">{fanpage.address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
