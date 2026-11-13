import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Plus, Menu, X, MessageSquare, Bell } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { useAuthStore, isStaffUser } from '@/features/auth'
import { useFanpageUnreadNotificationCount } from '@/features/notifications'
import { AccountNavigationPopup } from '@/shared/components/layout/AccountNavigationPopup'
import { FanpageNotificationDropdown } from './FanpageNotificationDropdown'
import type { FanpageSummary } from '../types/fanpageAdmin.types'

interface FanpageAdminTopNavProps {
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  currentFanpageId?: string
  currentFanpageRole?: string
  currentFanpageName?: string
  currentFanpageAvatarUrl?: string
  availableFanpages?: FanpageSummary[]
  onSelectFanpage?: (fanpage: FanpageSummary) => void
  onLogoClick?: () => void
  onCreateEventClick?: () => void
  onPersonalProfileClick?: () => void
}

export const FanpageAdminTopNav: React.FC<FanpageAdminTopNavProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  currentFanpageId,
  currentFanpageRole,
  currentFanpageName,
  currentFanpageAvatarUrl,
  availableFanpages,
  onSelectFanpage,
  onLogoClick,
  onCreateEventClick,
  onPersonalProfileClick,
}) => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAccountPopup, setShowAccountPopup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Số lượng thông báo chưa đọc của Fanpage
  const { data: unreadNotificationsCount = 0 } = useFanpageUnreadNotificationCount(currentFanpageId)

  const isCurrentUserAdmin =
    currentFanpageRole === 'Quản trị viên' ||
    currentFanpageRole === 'ADMIN' ||
    (user ? isStaffUser(user) : false)
  const homePath = isCurrentUserAdmin ? '/fanpage/admin' : '/fanpage/workspace'

  const handleLogout = () => {
    // Xóa toàn bộ TanStack query cache khi đăng xuất
    queryClient.clear()
    clearAuth()
    setShowAccountPopup(false)
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

          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              className="flex items-center shrink-0 group transition-transform hover:opacity-95 cursor-pointer bg-transparent border-none p-0 text-left"
              title="Về trang quản trị Fanpage hiện tại"
            >
              <img
                src={logoSvg}
                alt="CTU Event - HTQL Sự Kiện"
                className="h-10 w-auto object-contain"
              />
            </button>
          ) : (
            <Link
              to={homePath}
              state={currentFanpageId ? { fanpageId: currentFanpageId } : undefined}
              className="flex items-center shrink-0 group transition-transform hover:opacity-95"
              title="Trang Fanpage"
            >
              <img
                src={logoSvg}
                alt="CTU Event - HTQL Sự Kiện"
                className="h-10 w-auto object-contain"
              />
            </Link>
          )}
        </div>

        {/* 2. Center: Search Bar with Integrated Filter Funnel (Student style) */}
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
              placeholder="Tìm kiếm sự kiện, hoạt động..."
              className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-12 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Bộ lọc nâng cao"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* 3. Right: Create Event Action, Messages, Notifications, & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Create Event CTA Button */}
          <button
            type="button"
            onClick={onCreateEventClick ? onCreateEventClick : () => navigate(`${homePath}?tab=create-event`)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo sự kiện</span>
          </button>

          {/* Messages */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Tin nhắn & Hỗ trợ"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications((prev) => !prev)
                setShowAccountPopup(false)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Thông báo Fanpage"
              aria-label={`Thông báo ${unreadNotificationsCount > 0 ? `(${unreadNotificationsCount} chưa đọc)` : ''}`}
            >
              <div className="relative flex items-center justify-center">
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white font-bold text-[9px] leading-none flex items-center justify-center ring-2 ring-card shadow-xs animate-in zoom-in-50">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </div>
            </button>

            {/* Fanpage Notification Dropdown */}
            {currentFanpageId && (
              <FanpageNotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                fanpageId={currentFanpageId}
                fanpageName={currentFanpageName}
              />
            )}
          </div>

          {/* Admin Avatar only with small fanpage badge at corner */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountPopup(!showAccountPopup)
                    setShowNotifications(false)
                  }}
                  className="relative flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full cursor-pointer"
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

                  {/* Logo fanpage nhỏ ở góc dưới avatar */}
                  {currentFanpageAvatarUrl ? (
                    <img
                      src={currentFanpageAvatarUrl}
                      alt={currentFanpageName || 'Fanpage'}
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 min-w-[16px] max-w-[16px] min-h-[16px] max-h-[16px] rounded-full object-cover border-2 border-white dark:border-card shadow-xs"
                    />
                  ) : currentFanpageName ? (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 min-w-[16px] max-w-[16px] min-h-[16px] max-h-[16px] rounded-full bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white dark:border-card shadow-xs">
                      {currentFanpageName.slice(0, 1).toUpperCase()}
                    </div>
                  ) : null}
                </button>

                {/* Account Navigation Popup */}
                <AccountNavigationPopup
                  isOpen={showAccountPopup}
                  onClose={() => setShowAccountPopup(false)}
                  user={user}
                  onLogout={handleLogout}
                  currentFanpageId={currentFanpageId}
                  currentFanpageRole={currentFanpageRole}
                  currentFanpageName={currentFanpageName}
                  currentFanpageAvatarUrl={currentFanpageAvatarUrl}
                  availableFanpages={availableFanpages}
                  onSelectFanpage={onSelectFanpage}
                  onProfileClick={() => {
                    setShowAccountPopup(false)
                    if (onPersonalProfileClick) {
                      onPersonalProfileClick()
                    } else {
                      navigate(`${homePath}?tab=personal-profile`)
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
