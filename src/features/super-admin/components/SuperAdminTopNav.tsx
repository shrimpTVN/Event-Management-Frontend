import { Tooltip } from '@/components/ui/tooltip'
import React, { useEffect, useRef, useState } from 'react'
import { Search, Bell, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import logoSvg from '@/assets/logo.svg'
import { useAuthStore } from '@/features/auth'
import { authService } from '@/features/auth/services/authService'
import { AccountNavigationPopup } from '@/shared/components/layout/AccountNavigationPopup'
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown'
import { useUnreadNotificationCount, useNotificationStream } from '@/features/notifications'
import { superAdminService } from '../services/superAdminService'
import type { SuperAdminUser, SuperAdminFanpage, SuperAdminEvent } from '../types/superAdmin.types'

interface SuperAdminTopNavProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onSelectUserResult?: (user: SuperAdminUser) => void
  onSelectFanpageResult?: (fanpage: SuperAdminFanpage) => void
  onSelectEventResult?: (event: SuperAdminEvent) => void
}

export const SuperAdminTopNav: React.FC<SuperAdminTopNavProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  searchQuery = '',
  onSearchChange,
  onSelectUserResult,
  onSelectFanpageResult,
  onSelectEventResult,
}) => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAccountPopup, setShowAccountPopup] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useNotificationStream()
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationCount()

  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setDebouncedKeyword('')
      return
    }
    const timer = setTimeout(() => setDebouncedKeyword(trimmed), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!isSearchOpen) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isSearchOpen])

  const globalSearchQuery = useQuery({
    queryKey: ['super-admin', 'global-search', debouncedKeyword],
    enabled: isSearchOpen && debouncedKeyword.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const [usersPage, fanpagesPage, eventsPage] = await Promise.all([
        superAdminService.getUsersPage({ page: 0, size: 5, keyword: debouncedKeyword }),
        superAdminService.getFanpagesPage({ page: 0, size: 5, keyword: debouncedKeyword }),
        superAdminService.getEventsPage({ page: 0, size: 5, keyword: debouncedKeyword }),
      ])
      return {
        users: usersPage.content,
        fanpages: fanpagesPage.content,
        events: eventsPage.content,
      }
    },
  })

  const searchResults = globalSearchQuery.data
  const hasAnyResults = Boolean(
    searchResults &&
      (searchResults.users.length || searchResults.fanpages.length || searchResults.events.length)
  )

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Proceed local cleanup even if backend request fails
    } finally {
      queryClient.clear()
      clearAuth()
      setShowAccountPopup(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-card/80">
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

          <Tooltip content="Trang Quản trị Hệ thống (Super Admin)">
            <Link
              to="/admin"
              className="flex items-center shrink-0 group transition-transform hover:opacity-95"
            >
              <img
                src={logoSvg}
                alt="CTU Event - HTQL Sự Kiện"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </Tooltip>
        </div>

        {/* 2. Center: Global Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              aria-label="Tìm kiếm người dùng, fanpage, sự kiện"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                onSearchChange?.(e.target.value)
                setIsSearchOpen(true)
              }}
              placeholder="Tìm kiếm người dùng, fanpage, sự kiện..."
              className="w-full h-10 rounded-xl border border-[#E5E7EB] dark:border-border bg-[#F9FAFB] dark:bg-background pl-10 pr-10 text-sm text-[#374151] dark:text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => {
                  onSearchChange?.('')
                  setDebouncedKeyword('')
                  setIsSearchOpen(false)
                }}
                className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSearchOpen && searchQuery.trim().length >= 2 && (
            <div
              role="region"
              aria-label="Kết quả tìm kiếm nhanh"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-white dark:bg-card p-3 shadow-xl text-left"
            >
              {globalSearchQuery.isPending ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Đang tìm kiếm...</p>
              ) : globalSearchQuery.isError ? (
                <p className="py-4 text-center text-xs text-destructive">
                  Không thể tìm kiếm lúc này. Vui lòng thử lại.
                </p>
              ) : !hasAnyResults ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Không tìm thấy kết quả phù hợp.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {searchResults!.users.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Người dùng
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {searchResults!.users.map((u: SuperAdminUser) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false)
                              onSelectUserResult?.(u)
                            }}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-foreground truncate">{u.name}</span>
                            <span className="text-muted-foreground truncate shrink-0">
                              {u.code || u.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults!.fanpages.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Fanpage
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {searchResults!.fanpages.map((fp: SuperAdminFanpage) => (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false)
                              onSelectFanpageResult?.(fp)
                            }}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-foreground truncate">{fp.name}</span>
                            <span className="text-muted-foreground truncate shrink-0">
                              {fp.representativeName || fp.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults!.events.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sự kiện
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {searchResults!.events.map((evt: SuperAdminEvent) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false)
                              onSelectEventResult?.(evt)
                            }}
                            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-foreground truncate">{evt.title}</span>
                            <span className="text-muted-foreground truncate shrink-0">
                              {evt.fanpageName}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Right: Notifications & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications */}
          <div className="relative">
            <Tooltip content="Thông báo hệ thống">
              <button
                type="button"
                aria-expanded={showNotifications}
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Thông báo hệ thống"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span
                    aria-label={`${unreadNotificationsCount} thông báo chưa đọc`}
                    className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card"
                  />
                )}
              </button>
            </Tooltip>
            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
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
