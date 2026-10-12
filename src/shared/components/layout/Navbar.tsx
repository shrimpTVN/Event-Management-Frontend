import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  MessageSquare,
  Bell,
  LogOut,
  User,
  CheckCircle2,
  Award,
  LayoutDashboard,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* 1. Brand Logo: CTU Event (HTQL Sự Kiện) */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          {/* CTU Diamond Emblem */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border-2 border-primary/80 bg-brand-subtle rotate-45 shadow-sm group-hover:border-primary transition-colors">
            <span className="-rotate-45 font-extrabold text-primary text-xs tracking-tighter">
              CTU
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="flex items-center text-lg sm:text-xl font-extrabold tracking-tight">
              <span className="text-foreground">CTU</span>
              <span className="text-sky-500 ml-1">Event</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              HTQL Sự Kiện
            </span>
          </div>
        </Link>

        {/* 2. Center: Search Bar with Integrated Filter Funnel */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-full h-10 rounded-xl border border-border bg-background pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg z-50 text-sm">
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
                      >
                        <User className="h-4 w-4 text-primary" />
                        Hồ sơ sinh viên
                      </Link>
                      <Link
                        to="/checkin"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Check-in khuôn mặt
                      </Link>
                      <Link
                        to="/certificate"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                      >
                        <Award className="h-4 w-4 text-primary" />
                        Chứng nhận E-Certificate
                      </Link>
                      {user.role === 'ORGANIZER' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                          Quản lý kiểm duyệt
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-border/60">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Default student avatar icon button linking to profile */}
                <Link
                  to="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-sm text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                  title="Hồ sơ sinh viên"
                >
                  U
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
