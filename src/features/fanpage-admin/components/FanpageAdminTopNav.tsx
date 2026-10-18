import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, SlidersHorizontal, Plus, Menu, X, MessageSquare } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { useAuthStore } from '@/features/auth'

interface FanpageAdminTopNavProps {
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export const FanpageAdminTopNav: React.FC<FanpageAdminTopNavProps> = ({
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessages, setShowMessages] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-white dark:bg-card border-b border-[#E5E7EB] dark:border-border px-4 sm:px-6 lg:px-8">
      <div className="h-full w-full grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Mobile Toggle & CTU Brand Logo (Logo only, as requested) */}
        <div className="flex items-center gap-3 justify-self-start shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/fanpage/admin" className="flex items-center group">
            <img
              src={logoSvg}
              alt="CTU Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Center: Search Bar with Filter button - Symmetrically centered */}
        <div className="hidden md:flex w-[480px] lg:w-[560px] justify-self-center">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong trang quản trị..."
              className="w-full h-10 pl-10 pr-24 rounded-xl border border-[#D1D5DB] dark:border-border bg-[#F9FAFB] dark:bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              type="button"
              className="absolute right-1.5 px-2.5 h-7 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-1 transition-colors cursor-pointer"
              title="Lọc kết quả"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Lọc</span>
            </button>
          </div>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-3 justify-self-end shrink-0">
          {/* Quick Create Event */}
          <Link
            to="/events/create"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo sự kiện</span>
          </Link>

          {/* Messages Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMessages(!showMessages)
                if (showNotifications) setShowNotifications(false)
              }}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Tin nhắn"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-card" />
            </button>

            {/* Messages Dropdown Preview */}
            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-white dark:bg-card shadow-lg p-4 space-y-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="font-semibold text-sm text-foreground">Hộp thư Fanpage</h4>
                  <span className="text-[11px] font-medium text-primary cursor-pointer hover:underline">
                    Xem tất cả
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-foreground cursor-pointer hover:bg-primary/10 transition-colors">
                    <p className="font-semibold text-foreground">Nguyễn Văn A (DI2496A1)</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 truncate">
                      Cho em hỏi sự kiện Ngày hội việc làm có giới hạn số lượng tham gia không ạ?
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">5 phút trước</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 text-foreground cursor-pointer hover:bg-muted/70 transition-colors">
                    <p className="font-semibold text-foreground">Lê Thị Bích (B21DCCN042)</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 truncate">
                      Dạ em đã gửi minh chứng tham gia, nhờ anh chị duyệt ĐRL giúp em.
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">1 giờ trước</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (showMessages) setShowMessages(false)
              }}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-card" />
            </button>

            {/* Notifications Dropdown Preview */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-white dark:bg-card shadow-lg p-4 space-y-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="font-semibold text-sm text-foreground">Thông báo quản trị</h4>
                  <span className="text-[11px] font-medium text-primary cursor-pointer hover:underline">
                    Đã xem tất cả
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-foreground">
                    <p className="font-medium text-foreground">Có 3 sinh viên vừa đăng ký sự kiện</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Ngày hội việc làm CNTT 2026 · 10 phút trước</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 text-foreground">
                    <p className="font-medium text-foreground">Sự kiện đã được duyệt công khai</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Ban cán sự Đoàn trường · 2 giờ trước</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <div className="h-9 w-9 rounded-full bg-[#1B4B8A] text-white flex items-center justify-center font-bold text-xs shadow-xs select-none">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'QT'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {user?.name || 'Quản trị viên'}
              </span>
              <span className="text-[10px] text-muted-foreground">quantri@ctu.edu.vn</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
