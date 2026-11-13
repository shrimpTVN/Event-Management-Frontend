import React, { useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, LogOut, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type User, isStaffUser, isStaffEmail } from '@/features/auth'
import { profileService } from '@/features/profile/services/profileService'
import { fanpageAdminService } from '@/features/fanpage-admin/services/fanpageAdminService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'

interface AccountNavigationPopupProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onLogout: () => void
  className?: string
  onProfileClick?: () => void
  currentFanpageId?: string
  currentFanpageRole?: string
  currentFanpageName?: string
  currentFanpageAvatarUrl?: string
  availableFanpages?: any[]
  onSelectFanpage?: (fanpage: any) => void
}

/**
 * Facebook-style Switch Avatar with rotating circular arrows encircling the inner avatar
 */
export const SwitchAvatar: React.FC<{
  avatarUrl?: string
  name: string
  className?: string
  bgClassName?: string
  textClassName?: string
}> = ({
  avatarUrl,
  name,
  className = '',
  bgClassName = 'bg-[#4B5563] text-white',
  textClassName = 'text-[11px] font-bold text-white',
}) => {
  const initial = (name || 'F').trim().charAt(0).toUpperCase()
  return (
    <div className={`relative w-10 h-10 flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer circular arrows hugging the avatar */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 w-full h-full text-[#6B7280] dark:text-muted-foreground transform-gpu origin-center transition-transform duration-500 ease-in-out group-hover:rotate-180 pointer-events-none"
      >
        <path d="M3.2 12a8.8 8.8 0 0 1 15.6-5.5" />
        <path d="M19.5 2.8v4.2h-4.2" />
        <path d="M20.8 12a8.8 8.8 0 0 1-15.6 5.5" />
        <path d="M4.5 21.2v-4.2h4.2" />
      </svg>

      {/* Inner Avatar circle */}
      <div
        className={`w-[22px] h-[22px] rounded-full overflow-hidden flex items-center justify-center border border-white dark:border-background shadow-2xs select-none ${bgClassName}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={textClassName}>{initial}</span>
        )}
      </div>
    </div>
  )
}

export const AccountNavigationPopup: React.FC<AccountNavigationPopupProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  className = '',
  onProfileClick,
  currentFanpageId,
  currentFanpageRole,
  currentFanpageName,
  currentFanpageAvatarUrl,
  availableFanpages: propAvailableFanpages,
  onSelectFanpage,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Kiểm tra người dùng có phải là sinh viên CTU hay không:
  // - Email kết thúc bằng @student.ctu.edu.vn hoặc bắt đầu bằng student
  // - Hoặc có MSSV (studentId)
  // - Hoặc có role STUDENT / ROLE_STUDENT
  // - Không phải cán bộ thuần (organizer@ctu.edu.vn, canbo@ctu.edu.vn...)
  const isStudent = useMemo(() => {
    if (!user) return false
    const email = (user.email || '').trim().toLowerCase()
    if (email.endsWith('@student.ctu.edu.vn') || email.startsWith('student')) return true
    if (user.studentId) return true
    if (user.role === 'STUDENT' || user.role === 'ROLE_STUDENT') return true
    if (Array.isArray(user.roles) && user.roles.some((r) => r === 'STUDENT' || r === 'ROLE_STUDENT')) return true
    return !isStaffEmail(email)
  }, [user])

  const isStaff = !isStudent && isStaffUser(user)
  const isAdmin =
    user.role === 'ADMIN' ||
    user.role === 'ROLE_ADMIN' ||
    (user as any).roles?.includes('ADMIN') ||
    (user as any).roles?.includes('ROLE_ADMIN') ||
    user.email?.includes('admin')

  // Kiểm tra xem hiện tại có đang trong không gian làm việc Fanpage hay không
  // Lưu ý: /fanpage/:id hay /fanpages/:id là trang xem công khai của sinh viên, KHÔNG PHẢI không gian quản trị!
  const isFanpageWorkspace =
    Boolean(currentFanpageId) ||
    location.pathname.startsWith('/fanpage/admin') ||
    location.pathname.startsWith('/fanpage/workspace') ||
    location.pathname.startsWith('/fanpage/manage') ||
    location.pathname.startsWith('/admin/fanpage') ||
    location.pathname.startsWith('/fanpage-admin')

  // Lấy ĐÚNG danh sách Fanpage thực tế trong DB mà người dùng này có tham gia (Admin hoặc Thành viên/Cộng tác viên)
  const { data: dbFanpages = [] } = useQuery({
    queryKey: ['my-participating-fanpages', user.id, user.email],
    queryFn: async () => {
      const fanpageMap = new Map<
        string,
        {
          id: string
          name: string
          fullName?: string
          avatarUrl?: string
          role: string
          isAdmin: boolean
        }
      >()

      // 1. Lấy danh sách fanpage từ backend API (/fanpages/my-fanpages)
      try {
        const adminPages = await fanpageAdminService.getAvailableFanpages()
        if (Array.isArray(adminPages)) {
          for (const fp of adminPages) {
            const role = fp.role || 'Quản trị viên'
            fanpageMap.set(String(fp.id), {
              id: String(fp.id),
              name: fp.name,
              fullName: fp.fullName || fp.name,
              avatarUrl: fp.avatarUrl,
              role,
              isAdmin: role === 'Quản trị viên' || role === 'ADMIN',
            })
          }
        }
      } catch (err) {
        console.warn('Could not fetch admin fanpages:', err)
      }

      const result = Array.from(fanpageMap.values())

      // Tự động đồng bộ và dọn dẹp các fanpage không còn thuộc về người dùng khỏi userFanpagesStore
      try {
        useUserFanpagesStore.getState().setMyFanpages(
          result.map((f) => ({
            id: f.id,
            name: f.name,
            role: f.role,
            avatarUrl: f.avatarUrl,
          }))
        )
      } catch (storeErr) {
        console.warn('Could not sync userFanpagesStore:', storeErr)
      }

      return result
    },
    enabled: isOpen && Boolean(user),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  // Dữ liệu fanpage chuẩn xác từ cơ sở dữ liệu và props
  const allFanpages = useMemo(() => {
    const map = new Map<string, any>()
    if (Array.isArray(propAvailableFanpages)) {
      for (const fp of propAvailableFanpages) {
        map.set(String(fp.id), {
          id: String(fp.id),
          name: fp.name,
          fullName: fp.fullName || fp.name,
          avatarUrl: fp.avatarUrl,
          role: fp.role || 'Quản trị viên',
          isAdmin: fp.role === 'Quản trị viên' || fp.role === 'ADMIN',
        })
      }
    }
    for (const fp of dbFanpages) {
      map.set(String(fp.id), fp)
    }
    return Array.from(map.values())
  }, [propAvailableFanpages, dbFanpages])

  // Fetch real student profile from backend (/users/me/profile)
  const { data: profile } = useQuery({
    queryKey: ['my-profile', user.email],
    queryFn: () => profileService.getMyProfile(),
    enabled: isOpen && !isStaff && Boolean(user.email),
    staleTime: 5 * 60 * 1000,
  })

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
  const getDisplayName = (): string => {
    if (profile?.fullName) return profile.fullName
    const emailPrefix = (user.email || '').split('@')[0]
    if (user.name && user.name.toLowerCase() !== emailPrefix.toLowerCase()) {
      return user.name
    }
    return user.name || 'Đoàn Tài Lộc'
  }

  const displayName = getDisplayName()

  const displaySubtitle = isStaff
    ? user.email || 'Ban quản trị Fanpage'
    : studentMssv
      ? `MSSV: ${studentMssv}`
      : user.email || ''

  // Avatar cá nhân thật (ảnh đại diện nếu có, hoặc chữ cái viết tắt trên nền xanh thương hiệu #1B4B8A)
  const userAvatarUrl = profile?.avatarUrl || user.avatarUrl
  const userInitial = (displayName || user.name || 'U').trim().charAt(0).toUpperCase()

  // Fanpage hiện tại nếu đang trong không gian quản trị Fanpage
  const activeFanpageId = isFanpageWorkspace
    ? currentFanpageId ||
      (location.state as any)?.fanpageId ||
      (allFanpages.length > 0 ? allFanpages[0]?.id : undefined)
    : undefined

  const currentFanpage = isFanpageWorkspace
    ? allFanpages.find((fp) => String(fp.id) === String(activeFanpageId)) ||
      (currentFanpageId
        ? {
            id: String(currentFanpageId),
            name: currentFanpageName || 'Không gian Fanpage',
            role: currentFanpageRole || 'Cộng tác viên',
            avatarUrl: currentFanpageAvatarUrl,
            isAdmin: currentFanpageRole === 'Quản trị viên' || currentFanpageRole === 'ADMIN',
          }
        : allFanpages[0])
    : undefined

  // Danh sách các fanpage khác để chuyển đổi:
  // - Khi đang trong không gian Fanpage: loại trừ fanpage hiện tại (vì nó đã hiển thị ở thẻ chính trên cùng)
  // - Khi ở ngoài (trang sinh viên / theo dõi fanpage): hiển thị toàn bộ danh sách fanpage để có thể chuyển đổi
  const availableSwitchFanpages =
    isFanpageWorkspace && currentFanpage
      ? allFanpages.filter((fp) => String(fp.id) !== String(currentFanpage.id))
      : allFanpages

  // Chuyển sang không gian làm việc của Fanpage:
  // - Nếu là Admin: /fanpage/admin
  // - Nếu là Member / Sinh viên cộng tác viên: /fanpage/workspace (tránh /admin)
  const handleSwitchToFanpage = (fp: { id: string; role?: string; isAdmin?: boolean; name?: string }) => {
    onClose()
    if (onSelectFanpage) {
      onSelectFanpage(fp)
    }
    const isTargetAdmin = fp.isAdmin || fp.role === 'ADMIN' || fp.role === 'Quản trị viên' || isStaff
    const path = isTargetAdmin ? '/fanpage/admin' : '/fanpage/workspace'
    navigate(path, { state: { fanpageId: String(fp.id) } })
  }

  const handleGoToProfile = () => {
    onClose()
    if (onProfileClick) {
      onProfileClick()
    } else {
      navigate('/profile')
    }
  }

  const handleViewAllPages = () => {
    onClose()
    if (isStaff) {
      navigate('/staff/fanpages')
    } else if (allFanpages.length > 0) {
      const first = allFanpages[0]
      const isTargetAdmin = first.isAdmin || first.role === 'ADMIN' || first.role === 'Quản trị viên'
      navigate(isTargetAdmin ? '/fanpage/admin' : '/fanpage/workspace', {
        state: { fanpageId: String(first.id) },
      })
    } else {
      navigate('/events')
    }
  }

  return (
    <div
      ref={popupRef}
      className={`absolute right-0 top-full mt-2 w-[280px] rounded-2xl border border-[#E1E7EF] dark:border-border bg-white dark:bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-left select-none ${className}`}
      role="menu"
      aria-orientation="vertical"
    >
      {/* =========================================================================
          TRƯỜNG HỢP 1: ĐANG Ở TRONG KHÔNG GIAN FANPAGE WORKSPACE
          - Hiển thị thông tin Fanpage hiện tại đang dùng ở trên cùng
          - Nếu là sinh viên: Nút chuyển lại tài khoản sinh viên có avatar sinh viên + mũi tên xoay xoay ôm bên ngoài (SwitchAvatar), click quay lại trang chủ sinh viên '/'
          - Nếu là cán bộ: Nút quay lại Trung tâm quản lý Fanpage '/staff/fanpages'
          - Danh sách các fanpage khác có thể chuyển đổi
         ========================================================================= */}
      {isFanpageWorkspace ? (
        <>
          {/* Thông tin tài khoản cá nhân & Fanpage đang quản lý với logo fanpage nhỏ dưới avatar */}
          <button
            type="button"
            onClick={handleGoToProfile}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left"
            role="menuitem"
            title="Xem thông tin cá nhân"
          >
            {/* Avatar cá nhân với logo fanpage nhỏ ở góc dưới */}
            <div className="relative shrink-0 w-11 h-11">
              <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border border-border/60 bg-[#1B4B8A] text-white shadow-xs">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-base text-white">{userInitial}</span>
                )}
              </div>

              {/* Logo fanpage hiện tại nhỏ ở góc dưới avatar */}
              {currentFanpage?.avatarUrl ? (
                <img
                  src={currentFanpage.avatarUrl}
                  alt={currentFanpage.name}
                  title={`Fanpage: ${currentFanpage.name}`}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 min-w-[16px] max-w-[16px] min-h-[16px] max-h-[16px] rounded-full object-cover border-2 border-white dark:border-card shadow-xs"
                />
              ) : (
                <div
                  title={`Fanpage: ${currentFanpage?.name}`}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 min-w-[16px] max-w-[16px] min-h-[16px] max-h-[16px] rounded-full bg-[#374151] text-white text-[8px] font-bold flex items-center justify-center border-2 border-white dark:border-card shadow-xs"
                >
                  {(currentFanpage?.name || 'FP').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-foreground block truncate">
                {displayName}
              </span>
              <span className="font-medium text-xs text-foreground/90 block truncate" title={currentFanpage?.name}>
                {currentFanpage?.name || 'Không gian Fanpage'}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {currentFanpage?.role || currentFanpageRole || 'Quản trị viên'}
              </span>
            </div>
          </button>

          <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />

          {/* Danh sách các fanpage khác có thể chuyển sang */}
          {(availableSwitchFanpages.length > 0 || isStudent) && (
            <>
              <div className="space-y-1">
                {availableSwitchFanpages.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Fanpage khác
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {availableSwitchFanpages.length} trang
                    </span>
                  </div>
                )}

                {/* Các Fanpage khác mà user có quyền quản lý/tham gia */}
                {availableSwitchFanpages.map((fp) => (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => handleSwitchToFanpage(fp)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left group"
                    role="menuitem"
                    title={`Chuyển sang ${fp.name}`}
                  >
                    <SwitchAvatar avatarUrl={fp.avatarUrl} name={fp.name} />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs text-foreground block truncate group-hover:text-primary transition-colors">
                        {fp.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {fp.role || (fp.isAdmin ? 'Quản trị viên' : 'Cộng tác viên')}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Chuyển lại tài khoản sinh viên (nếu là sinh viên) */}
                {isStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/')
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left group"
                    role="menuitem"
                    title="Quay lại trang chủ sinh viên"
                  >
                    <SwitchAvatar
                      avatarUrl={userAvatarUrl}
                      name={displayName}
                      bgClassName="bg-[#1B4B8A] text-white"
                      textClassName="text-[11px] font-bold text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs text-foreground block truncate group-hover:text-primary transition-colors">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-[#1B4B8A] dark:text-blue-400 font-medium block truncate">
                        {studentMssv ? `MSSV: ${studentMssv} · Sinh viên` : 'Tài khoản sinh viên'}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />
            </>
          )}
        </>
      ) : (
        /* =========================================================================
            TRƯỜNG HỢP 2: ĐANG Ở TRANG SINH VIÊN HOẶC TRANG NGOÀI WORKSPACE
            - Hiển thị thông tin tài khoản cá nhân thật ở trên cùng (nhấn vào xem profile)
            - Danh sách các fanpage tham gia với nút chuyển có avatar ôm mũi tên xoay xoay
           ========================================================================= */
        <>
          {/* Thẻ tài khoản cá nhân hiện tại */}
          <button
            type="button"
            onClick={handleGoToProfile}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left"
            role="menuitem"
            title="Nhấn để xem thông tin cá nhân"
          >
            {/* Avatar cá nhân thật (ảnh hoặc chữ cái viết tắt nền xanh #1B4B8A) */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-border/60 bg-[#1B4B8A] text-white shadow-xs">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-sm text-white">{userInitial}</span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-foreground block truncate">
                {displayName}
              </span>
              {displaySubtitle && (
                <span className="font-medium text-xs text-muted-foreground block truncate">
                  {displaySubtitle}
                </span>
              )}
            </div>
          </button>

          <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />

          {/* Danh sách Fanpage tham gia (Admin hoặc Cộng tác viên) với avatar ôm mũi tên xoay xoay */}
          {allFanpages.length > 0 && (
            <>
              <div className="space-y-1">
                {allFanpages.map((fp) => (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => handleSwitchToFanpage(fp)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left group"
                    role="menuitem"
                  >
                    <SwitchAvatar avatarUrl={fp.avatarUrl} name={fp.name} />

                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-sm text-foreground block truncate">
                        {fp.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {fp.role || (fp.isAdmin ? 'Quản trị viên' : 'Cộng tác viên')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />
            </>
          )}
        </>
      )}

      {/* =========================================================================
          HÀNH ĐỘNG CHUNG: XEM TẤT CẢ TRANG & ĐĂNG XUẤT
          - Đã bỏ nút "Về trang chủ sinh viên" khi đang ở trang chủ sinh viên
         ========================================================================= */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleViewAllPages}
          className="w-full py-2.5 px-3 rounded-xl bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-muted dark:hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          role="menuitem"
        >
          <Users className="w-4 h-4 text-foreground shrink-0" />
          <span>Xem tất cả trang</span>
        </button>
      </div>

      <div className="pt-2 border-t border-[#EDF0F4] dark:border-border/60 mt-2 space-y-1">
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/admin')
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-[#1B4B8A] dark:text-blue-400 hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors font-medium text-xs cursor-pointer text-left"
            role="menuitem"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B4B8A]/10 text-[#1B4B8A] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs">Quản trị hệ thống</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose()
            onLogout()
          }}
          className="w-full flex items-center gap-3 p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium text-xs cursor-pointer text-left group"
          role="menuitem"
        >
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}

export default AccountNavigationPopup
