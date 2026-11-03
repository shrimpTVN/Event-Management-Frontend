import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, LogOut, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type User, isStaffUser } from '@/features/auth'
import { profileService } from '@/features/profile/services/profileService'
import { useAuthStore } from '@/features/auth/store/authStore'

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
  const isStaff = isStaffUser(user)
  const isAdmin =
    user.role === 'ADMIN' ||
    user.role === 'ROLE_ADMIN' ||
    (user as any).roles?.includes('ADMIN') ||
    (user as any).roles?.includes('ROLE_ADMIN') ||
    user.email?.includes('admin')
  const updateUser = useAuthStore((state) => state.updateUser)

  // Fetch real student profile from backend (/users/me/profile)
  const { data: profile } = useQuery({
    queryKey: ['my-profile', user.email],
    queryFn: () => profileService.getMyProfile(),
    enabled: isOpen && !isStaff && Boolean(user.email),
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize profile name, studentId and avatarUrl to authStore if available
  useEffect(() => {
    if (profile) {
      const realName = profile.fullName?.trim()
      const realStudentId = profile.studentId?.trim()
      if (
        (realName && realName !== user.name) ||
        (realStudentId && realStudentId !== user.studentId) ||
        (profile.avatarUrl && profile.avatarUrl !== user.avatarUrl)
      ) {
        updateUser({
          ...(realName ? { name: realName } : {}),
          ...(realStudentId ? { studentId: realStudentId } : {}),
          ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        })
      }
    }
  }, [profile, user.name, user.studentId, user.avatarUrl, updateUser])

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

  // Extract student ID from profile, user object or CTU email (e.g. locb2303827@student.ctu.edu.vn -> B2303827)
  const extractStudentId = (u: User): string => {
    if (profile?.studentId) return profile.studentId.toUpperCase()
    if (u.studentId) {
      const match = u.studentId.match(/([a-zA-Z]\d{7})/i)
      if (match) return match[1].toUpperCase()
      if (/^[a-zA-Z]\d{7}$/.test(u.studentId)) return u.studentId.toUpperCase()
    }
    const match = u.email?.match(/([a-zA-Z]\d{7})/i)
    if (match) return match[1].toUpperCase()
    return ''
  }

  const studentMssv = extractStudentId(user)

  // Real display name resolution:
  // 1. profile.fullName from backend if available
  // 2. user.name IF it's not just the email username string (e.g. "Locb2303827")
  // 3. Fallback
  const getDisplayName = (): string => {
    if (profile?.fullName) return profile.fullName
    const emailPrefix = (user.email || '').split('@')[0]
    if (user.name && user.name.toLowerCase() !== emailPrefix.toLowerCase()) {
      return user.name
    }
    if (isStaff) return 'Cán bộ quản trị'
    return studentMssv ? `Sinh viên (${studentMssv})` : 'Sinh viên CTU'
  }

  const displayName = getDisplayName()

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

      {/* 2. Điều hướng cá nhân / Quản lý cán bộ / Quản trị */}
      <div className="py-1.5 space-y-0.5">
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#111827] dark:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-accent transition-colors font-sans text-sm font-medium"
            role="menuitem"
          >
            <Shield className="w-5 h-5 text-[#1B4B8A] dark:text-blue-400 shrink-0" />
            <span>Quản trị hệ thống</span>
          </Link>
        )}
        <Link
          to={primaryNavPath}
          onClick={onClose}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#111827] dark:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-accent transition-colors font-sans text-sm font-medium"
          role="menuitem"
        >
          <UserRound className="w-5 h-5 text-[#4B5563] dark:text-muted-foreground shrink-0" />
          <span>{primaryNavLabel}</span>
        </Link>
      </div>

      {/* Đường phân cách */}
      <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60" />

      {/* 3. Đăng xuất */}
      <div className="py-1.5">
        <button
          type="button"
          onClick={() => {
            onClose()
            onLogout()
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2]/50 dark:hover:bg-red-950/30 transition-colors font-sans text-sm font-medium cursor-pointer"
          role="menuitem"
        >
          <LogOut className="w-5 h-5 text-[#DC2626] shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
