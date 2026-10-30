import React from 'react'
import { Mail, Phone, MapPin, Building2, ShieldCheck } from 'lucide-react'
import type { FanpageDetail } from '../types/fanpage.types'

interface FanpageAboutCardProps {
  fanpage: FanpageDetail
}

export const FanpageAboutCard: React.FC<FanpageAboutCardProps> = ({ fanpage }) => {
  return (
    <div className="w-full bg-white dark:bg-card border border-border/50 dark:border-border/60 rounded-xl p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] space-y-3.5 text-left">
      {/* Title */}
      <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground tracking-tight">
        Giới thiệu
      </h3>

      {/* Description / Bio - Clean natural presentation without redundant "Mô tả" label */}
      {fanpage.description && (
        <p className="text-xs leading-relaxed text-[#4B5563] dark:text-muted-foreground whitespace-pre-line">
          {fanpage.description}
        </p>
      )}

      {/* Contact & Organization Details - Single-line inline flow */}
      <div className="space-y-3 pt-3 border-t border-border/60 text-xs">
        {/* Full Organization Name */}
        {fanpage.orgName && fanpage.orgName !== fanpage.name && (
          <div className="flex items-start gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-foreground font-medium">Đơn vị: </strong>
              {fanpage.orgName}
            </span>
          </div>
        )}

        {/* Parent Organization */}
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
              className="hover:text-primary hover:underline break-all transition-colors select-all"
            >
              {fanpage.email}
            </a>
          </div>
        )}

        {/* Phone / Hotline */}
        {fanpage.phone && (
          <div className="flex items-center gap-2.5 text-[#4B5563] dark:text-muted-foreground">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span>{fanpage.phone}</span>
          </div>
        )}

        {/* Office Address */}
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
