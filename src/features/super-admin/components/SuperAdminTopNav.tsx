import React, { useState } from 'react'
import { Search, Bell, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import logoSvg from '@/assets/logo.svg'
import { useAuthStore } from '@/features/auth'
import { AccountNavigationPopup } from '@/shared/components/layout/AccountNavigationPopup'

interface SuperAdminTopNavProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  unreadNotificationsCount?: number
}

export const SuperAdminTopNav: React.FC<SuperAdminTopNavProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  searchQuery = '',
  onSearchChange,
  unreadNotificationsCount = 2,
}) => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAccountPopup, setShowAccountPopup] = useState(false)

  const handleLogout = () => {
    queryClient.clear()
    clearAuth()
    setShowAccountPopup(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-white dark:bg-card border-b border-border shadow-xs flex items-center px-4 sm:px-6">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto gap-4">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted cursor-pointer transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5">
            <img src={logoSvg} alt="CTU Logo" className="h-9 w-auto shrink-0" />
            <div className="hidden sm:block">
              <span className="font-k2d font-bold text-sm tracking-tight text-[#1B4B8A] dark:text-blue-400 block leading-tight">
                CTU Event
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground block leading-tight">
                Super Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Tìm kiếm người dùng, fanpage, sự kiện..."
              className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-4 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* User Avatar & Dropdown preview with AccountNavigationPopup */}
          <div className="relative pl-2 border-l border-border">
            <button
              type="button"
              onClick={() => setShowAccountPopup(!showAccountPopup)}
              className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer group"
              title="Tài khoản cá nhân & chuyển đổi"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Quản trị viên'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#1B4B8A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'QT'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[140px]">
                  {user?.name || 'Quản Trị Viên'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {user?.email || 'superadmin@ctu.edu.vn'}
                </p>
              </div>
            </button>

            {user && (
              <AccountNavigationPopup
                isOpen={showAccountPopup}
                onClose={() => setShowAccountPopup(false)}
                user={user}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
