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
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
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
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    queryClient.clear()
    clearAuth()
    navigate('/login')
  }

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
    <aside className="w-[260px] h-full bg-white dark:bg-card border-r border-[#E5E7EB] dark:border-border flex flex-col justify-between p-4 select-none shrink-0 text-left">
      <div className="space-y-5 overflow-y-auto">
        {/* Super Admin Identity Badge Card */}
        <div className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background flex items-center gap-2.5 shadow-2xs">
          <div className="h-9 w-9 rounded-full bg-[#1B4B8A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-foreground truncate">
              Quản Trị Hệ Thống
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              Super Admin Portal
            </p>
          </div>
        </div>

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
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1B4B8A] text-white shadow-xs font-semibold'
                      : 'text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
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
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full h-10 px-3 rounded-xl flex items-center gap-2.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1B4B8A] text-white shadow-xs font-semibold'
                      : 'text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </button>
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

      {/* Footer Profile card */}
      <div className="pt-3 border-t border-[#E5E7EB] dark:border-border">
        <div className="p-2 rounded-xl bg-[#F9FAFB] dark:bg-background/80 border border-[#E5E7EB] dark:border-border flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'Quản trị viên'}
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-primary/30"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#1B4B8A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'QT'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-foreground truncate">
                {user?.name || 'Quản trị viên'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || 'superadmin@ctu.edu.vn'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
