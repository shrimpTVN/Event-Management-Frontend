import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useUIStore } from '@/shared'

interface SuperAdminTopNavProps {
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export const SuperAdminTopNav: React.FC<SuperAdminTopNavProps> = ({
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  const handleLogout = () => {
    queryClient.clear()
    clearAuth()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white dark:bg-card border-b border-border shadow-2xs flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Branding */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}

        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#1B4B8A] flex items-center justify-center text-white shadow-2xs font-bold text-base">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-k2d font-bold text-sm sm:text-base text-foreground tracking-tight leading-none">
                Hệ thống Quản trị Hệ thống
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                SUPER ADMIN
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Đại học Cần Thơ (CTU)
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Quick actions & user menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link
          to="/staff/fanpages"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Trang Fanpage</span>
        </Link>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Info / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold uppercase shrink-0">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[140px]">
              {user?.name || user?.email || 'Quản trị viên'}
            </span>
            <span className="text-[10px] text-muted-foreground">Super Administrator</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

