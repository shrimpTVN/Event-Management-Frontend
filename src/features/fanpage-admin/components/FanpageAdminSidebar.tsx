import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FilePenLine,
  Settings,
  ChevronsUpDown,
  LogOut,
  Check,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import type { FanpageSummary, AdminNavTab } from '../types/fanpageAdmin.types'

interface FanpageAdminSidebarProps {
  currentFanpage: FanpageSummary
  availableFanpages: FanpageSummary[]
  onSelectFanpage: (fanpage: FanpageSummary) => void
  activeTab?: AdminNavTab | null
  onSelectTab?: (tab: AdminNavTab) => void
}

export const FanpageAdminSidebar: React.FC<FanpageAdminSidebarProps> = ({
  currentFanpage,
  availableFanpages,
  onSelectFanpage,
  activeTab = null,
  onSelectTab,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [showNameTooltip, setShowNameTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Click outside to close name tooltip
  useEffect(() => {
    if (!showNameTooltip) return
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowNameTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNameTooltip])

  const handleLogout = () => {
    queryClient.clear()
    clearAuth()
    navigate('/login')
  }

  const navItems: { id: AdminNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'events', label: 'Sự kiện', icon: CalendarDays },
    { id: 'members', label: 'Thành viên', icon: Users },
    { id: 'profile', label: 'Thông tin fanpage', icon: FilePenLine },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ]

  return (
    <aside className="w-[248px] h-full flex flex-col justify-between p-4 bg-white dark:bg-card border-r border-[#E5E7EB] dark:border-border select-none shrink-0 text-left">
      <div className="space-y-6">
        {/* Fanpage Switcher Selector with Real Avatar & Name Tooltip */}
        <div className="relative">
          <div className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background hover:bg-muted/60 transition-all flex items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Fanpage Avatar - Circular real image or styled initial */}
              {currentFanpage.avatarUrl ? (
                <img
                  src={currentFanpage.avatarUrl}
                  alt={currentFanpage.name}
                  className="h-9 w-9 rounded-full object-cover shrink-0 shadow-xs border border-border/60"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#1B4B8A] text-white font-k2d font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {currentFanpage.code || currentFanpage.avatarText}
                </div>
              )}

              <div className="min-w-0 flex-1 relative">
                {/* Fanpage Name with Full Name Tooltip */}
                <button
                  type="button"
                  onClick={() => setShowNameTooltip((prev) => !prev)}
                  className="w-full text-left font-semibold text-xs text-foreground hover:text-primary transition-colors block truncate cursor-pointer"
                  title={currentFanpage.fullName || currentFanpage.name}
                >
                  {currentFanpage.name}
                </button>

                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {currentFanpage.role || 'Quản trị viên'}
                </p>

                {/* Tooltip chỉ hiển thị tên đầy đủ của fanpage */}
                {showNameTooltip && (
                  <div
                    ref={tooltipRef}
                    className="absolute left-0 top-full mt-1.5 w-max max-w-[230px] px-2.5 py-1.5 rounded-lg bg-[#0B1626] dark:bg-card text-white dark:text-foreground text-[11px] font-medium shadow-lg z-50 animate-in fade-in-0 zoom-in-95 leading-snug border border-white/10 dark:border-border select-text"
                  >
                    {currentFanpage.fullName || currentFanpage.name}
                  </div>
                )}
              </div>
            </div>

            {/* Switcher Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Đổi fanpage"
            >
              <ChevronsUpDown className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {/* Switcher Dropdown Menu */}
          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-2 w-full rounded-xl border border-border bg-white dark:bg-card shadow-lg p-2 z-50 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Fanpage của bạn
              </p>
              {availableFanpages.map((fp) => {
                const isSelected = fp.id === currentFanpage.id
                return (
                  <button
                    key={fp.id}
                    type="button"
                    title={fp.fullName || fp.name}
                    onClick={() => {
                      onSelectFanpage(fp)
                      setIsSwitcherOpen(false)
                    }}
                    className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {fp.avatarUrl ? (
                        <img
                          src={fp.avatarUrl}
                          alt={fp.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0 border border-border/50"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {fp.code}
                        </div>
                      )}
                      <span className="truncate">{fp.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}

              <div className="pt-2 border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSwitcherOpen(false)
                    navigate('/staff/fanpages')
                  }}
                  className="w-full p-2 rounded-lg text-left text-xs text-primary font-medium hover:bg-primary/5 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Quản lý danh sách fanpage</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
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
      </div>

      {/* Account Info & Logout */}
      <div className="pt-4 border-t border-[#E5E7EB] dark:border-border">
        <div className="p-2 rounded-xl bg-[#F9FAFB] dark:bg-background/80 border border-[#E5E7EB] dark:border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
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
            <div className="min-w-0">
              <p className="font-semibold text-xs text-foreground truncate">
                {user?.name || 'Quản trị fanpage'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || 'quantri@ctu.edu.vn'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
