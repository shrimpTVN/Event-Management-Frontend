import { Button } from '@/components/ui/button'
import React from 'react'
import {
  LayoutDashboard,
  Flag,
  Users,
  Calendar,
  CalendarRange,
  Award,
  Star,
  School,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SuperAdminNavTab } from '../types/superAdmin.types'

interface SuperAdminSidebarProps {
  activeTab: SuperAdminNavTab
  onSelectTab: (tab: SuperAdminNavTab) => void
  pendingFanpagesCount?: number
  violatedEventsCount?: number
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingFanpagesCount = 2,
  violatedEventsCount = 1,
}) => {
  const mainNavItems = [
    {
      id: 'overview' as SuperAdminNavTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'fanpages' as SuperAdminNavTab,
      label: 'Fanpage',
      icon: Flag,
      badge: pendingFanpagesCount > 0 ? `${pendingFanpagesCount} chờ duyệt` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      id: 'users' as SuperAdminNavTab,
      label: 'Người dùng',
      icon: Users,
    },
    {
      id: 'events' as SuperAdminNavTab,
      label: 'Sự kiện',
      icon: Calendar,
      badge: violatedEventsCount > 0 ? `${violatedEventsCount} vi phạm` : undefined,
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    },
  ]

  const configNavItems = [
    {
      id: 'semesters' as SuperAdminNavTab,
      label: 'Học kỳ niên khóa',
      icon: CalendarRange,
    },
    {
      id: 'point-categories' as SuperAdminNavTab,
      label: 'Điểm rèn luyện',
      icon: Award,
    },
    {
      id: 'sv5t-criterias' as SuperAdminNavTab,
      label: 'Tiêu chí SV 5 tốt',
      icon: Star,
    },
    {
      id: 'schools' as SuperAdminNavTab,
      label: 'Khoa/Trường & Ngành',
      icon: School,
    },
  ]

  return (
    <aside className="w-[260px] h-full bg-white dark:bg-card border-r border-[#E5E7EB] dark:border-border flex flex-col p-4 select-none shrink-0 text-left">
      <div className="space-y-5 overflow-y-auto">
        {/* Section 1: Main System Admin */}
        <div className="space-y-1.5">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Quản Lý Hệ Thống
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  variant="ghost"
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-subtle text-brand-subtle-foreground hover:bg-brand-subtle hover:text-brand-subtle-foreground font-semibold'
                      : 'text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-subtle-foreground' : 'text-muted-foreground'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Section 2: Master Data & Configurations */}
        <div className="space-y-1.5">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Dữ Liệu Danh Mục
          </p>
          <nav className="space-y-1">
            {configNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  variant="ghost"
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full h-10 px-3 rounded-lg flex items-center justify-start gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-subtle text-brand-subtle-foreground hover:bg-brand-subtle hover:text-brand-subtle-foreground font-semibold'
                      : 'text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-subtle-foreground' : 'text-muted-foreground'}`}
                  />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Quick link: Fanpage Admin View */}
        <div className="pt-2 border-t border-border/60">
          <Link
            to="/fanpage/admin"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors"
          >
            <span>Đến Ban tổ chức Fanpage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
