import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { StudentNavigationDrawer } from './StudentNavigationDrawer'
import studentLogo from '@/assets/CTU_logo.png'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
import { MessageSquare, Bell, Search } from 'lucide-react'
import logoImg from '@/assets/logo.svg'
import { AccountNavigationPopup } from './AccountNavigationPopup'
import { NotificationDropdown } from './NotificationDropdown'
import { NavbarSearchAutocomplete } from '@/features/events'
import { useUnreadNotificationCount, useNotificationStream } from '@/features/notifications'
import { fanpageService } from '@/features/fanpage/services/fanpageService'

export const Navbar: React.FC<{ mobileSubpage?: boolean }> = ({ mobileSubpage = false }) => {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    // Keep the portal in light mode while the theme switch is temporarily hidden.
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }, [])

  // Real-time SSE stream lắng nghe thông báo mới khi đăng nhập
  useNotificationStream()

  // Đếm số thông báo hệ thống chưa đọc từ Backend API (/notifications/unread-count)
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationCount()

  // Đếm số lời mời ban tổ chức fanpage đang PENDING (/fanpage-member-invitations/me)
  const { data: invitations = [] } = useQuery({
    queryKey: ['my-fanpage-member-invitations', user?.email],
    queryFn: () => fanpageService.getMyInvitations(),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  })

  const pendingInvitationsCount = Array.isArray(invitations)
    ? invitations.filter((i: any) => i.status === 'PENDING').length
    : 0
  const totalUnreadCount = (unreadNotificationsCount || 0) + pendingInvitationsCount

  const handleLogout = () => {
    // Xóa toàn bộ TanStack query cache khi đăng xuất
    queryClient.clear()
    clearAuth()
    setShowDropdown(false)
    navigate('/login')
  }

  return (
    <header className={`${mobileSubpage ? 'hidden md:block' : ''} sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80`}>
      <div className="flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-1 px-2 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <StudentNavigationDrawer user={user} onLogout={handleLogout} />
          {/* 1. Brand Logo: CTU Event (HTQL Sự Kiện) */}
          <Tooltip content="Trang chủ">
            <Link
              to="/"
              className="flex items-center shrink-0 group transition-transform hover:opacity-95"
            >
              <img
                src={logoImg}
                alt="CTU Event - HTQL Sự Kiện"
                className="hidden h-10 w-auto object-contain sm:block"
              />
              <img src={studentLogo} alt="CTU Event" className="h-9 w-9 object-contain sm:hidden" />
            </Link>
          </Tooltip>
        </div>

        {/* 2. Center: Search Bar with Autocomplete Suggestions & Filter Popup */}
        <NavbarSearchAutocomplete />
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-11 w-11 md:hidden"
          onClick={() => navigate('/events', { state: { focusSearch: true } })}
          aria-label="Tìm kiếm sự kiện"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* 3. Right: Communication, Notifications, & User Avatar */}
        <div className="flex items-center gap-0.5 sm:gap-3 shrink-0">
          {/* Chat / Feedback button */}
          <Tooltip content="Tin nhắn & Hỗ trợ">
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:flex"
              aria-label="Tin nhắn & Hỗ trợ"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </Tooltip>

          {/* Notifications Bell */}
          <div className="relative">
            <Tooltip content="Thông báo">
              <button
                type="button"
                onClick={() => {
                  if (isMobile) {
                    setShowNotifications(false)
                    setShowDropdown(false)
                    navigate('/notifications')
                  } else {
                    setShowNotifications((prev) => !prev)
                    setShowDropdown(false)
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label={`Thông báo ${totalUnreadCount > 0 ? `(${totalUnreadCount} chưa đọc)` : ''}`}
              >
                <div className="relative flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white font-bold text-[9px] leading-none flex items-center justify-center ring-2 ring-card shadow-xs animate-in zoom-in-50">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </div>
              </button>
            </Tooltip>

            {/* Notification Dropdown (Matching Facebook-style image on Desktop) */}
            <div className="hidden md:block">
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          </div>

          {/* User Profile Avatar with Initial 'U' or Photo */}
          <div className="relative hidden md:block">
            {isAuthenticated && user ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(!showDropdown)
                    setShowNotifications(false)
                  }}
                  aria-label="Tài khoản cá nhân"
                  className="flex h-11 w-11 items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full cursor-pointer"
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
