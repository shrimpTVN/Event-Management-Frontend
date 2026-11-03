import React from 'react'
import {
  LayoutDashboard,
  Users,
  Flag,
  CalendarDays,
  GraduationCap,
  Award,
  Star,
} from 'lucide-react'
import type { SuperAdminTab } from '../types/superAdmin.types'

interface SuperAdminSidebarProps {
  activeTab: SuperAdminTab
  onSelectTab: (tab: SuperAdminTab) => void
  pendingFanpagesCount?: number
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingFanpagesCount = 0,
}) => {
  const navItems: {
    id: SuperAdminTab
    label: string
    icon: React.FC<{ className?: string }>
    badge?: number
  }[] = [
    { id: 'overview', label: 'Tổng quan & Thống kê', icon: LayoutDashboard },
    { id: 'users', label: 'Quản lý người dùng', icon: Users },
    {
      id: 'fanpages',
      label: 'Quản lý Fanpage',
      icon: Flag,
      badge: pendingFanpagesCount > 0 ? pendingFanpagesCount : undefined,
    },
    { id: 'events', label: 'Quản lý sự kiện', icon: CalendarDays },
    { id: 'semesters', label: 'Học kỳ & Năm học', icon: GraduationCap },
    { id: 'training-points', label: 'Điểm rèn luyện', icon: Award },
    { id: 'sv5t', label: 'Sinh viên 5 Tốt', icon: Star },
  ]

  return (
    <aside className="w-64 h-full bg-white dark:bg-card border-r border-border flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Quản trị hệ thống
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1B4B8A] text-white shadow-2xs'
                    : 'text-foreground hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white text-[#1B4B8A]'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-left text-[11px] space-y-1">
        <div className="font-semibold text-foreground">CTU Event Management</div>
        <div className="text-muted-foreground">Phiên bản 2.0 · DDD Architecture</div>
      </div>
    </aside>
  )
}

