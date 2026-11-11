import React, { useState } from 'react'
import { Search, Bell, Menu, X, Filter, MessageSquare } from 'lucide-react'
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Left: Mobile Sidebar Toggle & CTU Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            to="/admin"
            className="flex items-center shrink-0 group transition-transform hover:opacity-95"
            title="Trang Quản trị Hệ thống (Super Admin)"
          >
            <img
              src={logoSvg}
              alt="CTU Event - HTQL Sự Kiện"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* 2. Center: Search Bar with Integrated Filter Funnel */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Tìm kiếm người dùng, fanpage, sự kiện..."
              className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-12 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
            <button
              type="button"
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Bộ lọc"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Right: Communication, Notifications, & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Chat / Feedback button */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Tin nhắn & Hỗ trợ"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Thông báo hệ thống"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
              )}
            </button>
          </div>

          {/* User Avatar only (No text name/email next to it) */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAccountPopup(!showAccountPopup)}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full cursor-pointer"
                  aria-label="Tài khoản cá nhân"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'Quản trị viên'}
                      className="h-9 w-9 rounded-full object-cover border-2 border-primary/30"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4B8A] font-bold text-sm text-white shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'Q'}
                    </div>
                  )}
                </button>

                <AccountNavigationPopup
                  isOpen={showAccountPopup}
                  onClose={() => setShowAccountPopup(false)}
                  user={user}
                  onLogout={handleLogout}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
