import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore, isStaffUser } from '@/features/auth'
import { Search, Filter, MessageSquare, Bell } from 'lucide-react'
import logoImg from '@/assets/logo.svg'
import { AccountNavigationPopup } from './AccountNavigationPopup'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    // Xóa toàn bộ TanStack query cache khi đăng xuất
    queryClient.clear()
    clearAuth()
    setShowDropdown(false)
    navigate('/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const isStaff = isStaffUser(user)
  const homePath = isStaff ? '/staff/fanpages' : '/'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Brand Logo: CTU Event (HTQL Sự Kiện) */}
        <Link
          to={homePath}
          className="flex items-center shrink-0 group transition-transform hover:opacity-95"
          title={isStaff ? 'Trung tâm Fanpage' : 'Trang chủ'}
        >
          <img
            src={logoImg}
            alt="CTU Event - HTQL Sự Kiện"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* 2. Center: Search Bar with Integrated Filter Funnel */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-12 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Bộ lọc nâng cao"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* 3. Right: Communication, Notifications, & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Chat / Feedback button */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Tin nhắn & Hỗ trợ"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Thông báo"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
          </button>

          {/* User Profile Avatar with Initial 'U' or Photo */}
          <div className="relative">
            {isAuthenticated && user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border-2 border-primary/30"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-sm text-primary-foreground shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {/* Account Navigation Popup */}
                <AccountNavigationPopup
                  isOpen={showDropdown}
                  onClose={() => setShowDropdown(false)}
                  user={user}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
