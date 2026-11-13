import React from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FilePenLine,
  Settings,
} from 'lucide-react'
import type { FanpageSummary, AdminNavTab } from '../types/fanpageAdmin.types'

interface FanpageAdminSidebarProps {
  currentFanpage?: FanpageSummary
  availableFanpages?: FanpageSummary[]
  onSelectFanpage?: (fanpage: FanpageSummary) => void
  activeTab?: AdminNavTab | null
  onSelectTab?: (tab: AdminNavTab) => void
}

export const FanpageAdminSidebar: React.FC<FanpageAdminSidebarProps> = ({
  activeTab = null,
  onSelectTab,
}) => {
  const navItems: { id: AdminNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'events', label: 'Sự kiện', icon: CalendarDays },
    { id: 'members', label: 'Thành viên', icon: Users },
    { id: 'profile', label: 'Thông tin fanpage', icon: FilePenLine },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ]

  return (
    <aside className="w-[248px] h-full flex flex-col p-4 bg-white dark:bg-card border-r border-[#E5E7EB] dark:border-border select-none shrink-0 text-left">
      <div className="space-y-2">
        <p className="px-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          Quản lý fanpage
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`w-full h-10 px-3 rounded-xl flex items-center gap-3 text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1B4B8A] text-white shadow-xs font-semibold'
                    : 'text-[#4B5563] dark:text-muted-foreground hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
