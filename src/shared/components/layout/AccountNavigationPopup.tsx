import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, LogOut } from 'lucide-react'
import { type User, isStaffUser } from '@/features/auth'

interface AccountNavigationPopupProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onLogout: () => void
  className?: string
}

export const AccountNavigationPopup: React.FC<AccountNavigationPopupProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  className = '',
}) => {
  const popupRef = useRef<HTMLDivElement>(null)

  // Handle click outside & Escape key
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Extract student ID from user object or CTU email (e.g. locb2303827@student.ctu.edu.vn -> B2303827)
  const extractStudentId = (u: User): string => {
    if (u.studentId) return u.studentId
    const match = u.email?.match(/([bB]\d{7})/i)
    if (match) return match[1].toUpperCase()
    return ''
  }

  const isStaff = isStaffUser(user)
  const displayName = user.name || (isStaff ? 'Cán bộ quản trị' : user.email || 'Người dùng')
  const studentMssv = extractStudentId(user)
  const displaySubtitle = isStaff
    ? user.email || 'Ban quản trị Fanpage'
    : studentMssv
      ? `MSSV: ${studentMssv}`
      : user.email || 'Sinh viên'
  const primaryNavPath = isStaff ? '/staff/fanpages' : '/profile'
  const primaryNavLabel = isStaff ? 'Trung tâm Fanpage' : 'Thông tin cá nhân'

  return (
    <div
      ref={popupRef}
      className={`absolute right-0 top-full mt-2 w-[256px] rounded-xl border border-[#E1E7EF] dark:border-border bg-card p-[6px] shadow-lg z-50 text-sm animate-in fade-in-0 zoom-in-95 duration-150 ${className}`}
      role="menu"
      aria-orientation="vertical"
    >
      {/* 1. Thông tin tài khoản */}
      <div className="h-[60px] py-2 px-3.5 flex items-center gap-2">
        {/* User Avatar with outer wrapper matching Figma (44x44, inner 36x36) */}
        <div className="w-11 h-11 rounded-full p-1 bg-[#F3F4F6] dark:bg-slate-800 shrink-0 flex items-center justify-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground flex items-center justify-center font-sans font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Details Stack */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-sans font-semibold text-sm leading-5 text-[#111827] dark:text-foreground truncate">
            {displayName}
          </span>
          <span className="font-sans font-medium text-xs leading-4 text-[#6B7280] dark:text-muted-foreground truncate">
            {displaySubtitle}
          </span>
        </div>
      </div>

      {/* Đường phân cách */}
      <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60" />

      {/* 2. Điều hướng cá nhân / Quản lý cán bộ */}
      <div className="py-1.5">
        <Link
          to={primaryNavPath}
          onClick={onClose}
          className="w-full h-[46px] px-3.5 rounded-lg bg-[#F3F6FA] dark:bg-muted/80 hover:bg-[#E8EFF7] dark:hover:bg-muted flex items-center gap-3 transition-colors group"
          role="menuitem"
        >
          <UserRound
            className="w-5 h-5 text-[#4B5563] dark:text-foreground shrink-0 transition-colors"
            strokeWidth={1.75}
          />
          <span className="font-sans font-medium text-sm leading-5 text-[#111827] dark:text-foreground">
            {primaryNavLabel}
          </span>
        </Link>
      </div>

      {/* Đường phân cách */}
      <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60" />

      {/* 3. Thoát tài khoản */}
      <div className="pt-1.5">
        <button
          type="button"
          onClick={() => {
            onClose()
            onLogout()
          }}
          className="w-full h-[46px] px-3.5 rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-950/25 flex items-center gap-3 transition-colors cursor-pointer group"
          role="menuitem"
        >
          <LogOut
            className="w-5 h-5 text-[#DC2626] shrink-0 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.75}
          />
          <span className="font-sans font-medium text-sm leading-5 text-[#DC2626]">
            Đăng xuất
          </span>
        </button>
      </div>
    </div>
  )
}
