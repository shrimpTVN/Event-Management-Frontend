import React from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { UpcomingEventReminder } from '../types/fanpageAdmin.types'

interface FanpageQuickCreateCardProps {
  reminder?: UpcomingEventReminder
}

export const FanpageQuickCreateCard: React.FC<FanpageQuickCreateCardProps> = ({ reminder }) => {
  return (
    <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-5 shadow-xs space-y-4 text-left">
      {/* Header */}
      <div className="space-y-0.5">
        <h3 className="font-k2d font-bold text-base text-[#0B1626] dark:text-foreground">
          Tạo sự kiện
        </h3>
        <p className="text-xs text-[#5B6675] dark:text-muted-foreground">
          Đăng một sự kiện mới lên fanpage.
        </p>
      </div>

      {/* Reminder Box (Figma: Thông tin nhanh [338x54]) */}
      {reminder && (
        <div className="p-3 rounded-xl bg-[#EFF5FC] dark:bg-primary/10 border border-[#DBEAFE] dark:border-primary/20 flex items-center gap-3">
          {/* Date Badge */}
          <div className="h-12 w-12 rounded-lg bg-white dark:bg-card border border-primary/20 shadow-2xs flex flex-col items-center justify-center shrink-0 leading-none">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
              {reminder.monthText}
            </span>
            <span className="font-k2d font-extrabold text-base text-foreground mt-0.5">
              {reminder.dayText}
            </span>
          </div>

          {/* Reminder text */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-foreground truncate">
              Sự kiện tiếp theo của bạn
            </h4>
            <p className="text-[11px] text-[#5B6675] dark:text-muted-foreground truncate mt-0.5">
              {reminder.title} · <strong className="text-primary">{reminder.registrationsCount}</strong> lượt đăng ký
            </p>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <Link
        to="/events/create"
        className="w-full h-10 rounded-xl bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Tạo sự kiện</span>
      </Link>
    </div>
  )
}
