import { Building2 as FanpageIcon } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import React, { useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, LogOut, ChevronRight, CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { type User, isStaffUser, isStudentUser, isSuperAdminUser } from '@/features/auth'
import { profileService } from '@/features/profile/services/profileService'
import { fanpageAdminService } from '@/features/fanpage-admin/services/fanpageAdminService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'

interface AccountNavigationPopupProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onLogout: () => void
  className?: string
  embedded?: boolean
  accountPicker?: boolean
  onProfileClick?: () => void
  currentFanpageId?: string
  currentFanpageRole?: string
  currentFanpageName?: string
  currentFanpageAvatarUrl?: string
  availableFanpages?: any[]
  onSelectFanpage?: (fanpage: any) => void
}

/**
 * Avatar with rotating arrows for switching accounts and fanpages
 */
export const SwitchAvatar: React.FC<{
  avatarUrl?: string
  name: string
  personal?: boolean
  className?: string
  bgClassName?: string
  textClassName?: string
}> = ({
  avatarUrl,
  name,
  className = '',
  personal = false,
  bgClassName = 'bg-[#4B5563] text-white',
  textClassName = 'text-[11px] font-bold text-white',
}) => {
  const initial = (name || 'F').trim().charAt(0).toUpperCase()
  return (
    <div className={`relative w-10 h-10 flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-muted-foreground transition-transform duration-500 ease-in-out group-hover:rotate-180 group-focus-visible:rotate-180 motion-reduce:transition-none"
      >
        <path d="M3 12a9 9 0 0 1 16.372-5.162v-3.5" />
        <path d="M21 12a9 9 0 0 1-16.372 5.162v3.5" />
      </svg>
      <div
        className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-white dark:border-background shadow-2xs select-none ${bgClassName}`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : personal ? (
          <span className={textClassName}>{initial}</span>
        ) : (
          <FanpageIcon className="h-3.5 w-3.5" aria-hidden="true" />
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
  embedded = false,
  accountPicker = false,
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

  const isStudent = isStudentUser(user) && !isSuperAdminUser(user)

  const isStaff = !isStudent && isStaffUser(user)

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
  const {
    data: dbFanpages = [],
    isError: isFanpagesError,
    refetch: refetchDbFanpages,
  } = useQuery({
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
      // Không nuốt lỗi để tránh ghi [] đè lên store khi 401/lỗi mạng
      const adminPages = await fanpageAdminService.getAvailableFanpages()
      if (Array.isArray(adminPages)) {
        for (const fp of adminPages) {
          const role = fp.role || 'Quản trị viên'
          const displayName = fp.fullName || fp.name
          fanpageMap.set(String(fp.id), {
            id: String(fp.id),
            name: displayName,
            fullName: displayName,
            avatarUrl: fp.avatarUrl,
            role,
            isAdmin: role === 'Quản trị viên' || role === 'ADMIN',
          })
        }
      }

      const result = Array.from(fanpageMap.values())

      // Tự động đồng bộ store chỉ khi fetch thành công
      try {
        useUserFanpagesStore.getState().setMyFanpages(
          result.map((f) => ({
            id: f.id,
            name: f.fullName || f.name,
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
        const displayName = fp.fullName || fp.name
        map.set(String(fp.id), {
          id: String(fp.id),
          name: displayName,
          fullName: displayName,
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
    if (!isOpen || embedded) return

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
  }, [isOpen, onClose, embedded])

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
    ? 'Ban quản trị Fanpage'
    : studentMssv
      ? `MSSV: ${studentMssv}`
      : ''

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

  const visibleSwitchFanpages = availableSwitchFanpages.slice(0, 3)

  // Chuyển sang không gian làm việc của Fanpage:
  // - Nếu là Admin: /fanpage/admin
  // - Nếu là Member / Sinh viên cộng tác viên: /fanpage/workspace (tránh /admin)
  const handleSwitchToFanpage = (fp: {
    id: string
    role?: string
    isAdmin?: boolean
    name?: string
  }) => {
    onClose()
    if (onSelectFanpage) {
      onSelectFanpage(fp)
    }
    const isTargetAdmin =
      fp.isAdmin || fp.role === 'ADMIN' || fp.role === 'Quản trị viên' || isStaff
    const path = isTargetAdmin ? '/fanpage/admin' : '/fanpage/workspace'
    navigate(path, { state: { fanpageId: String(fp.id) } })
  }

  const handleGoToProfile = () => {
    onClose()
    if (onProfileClick) {
      onProfileClick()
    } else {
      navigate(isStaff ? '/staff/fanpages' : isSuperAdminUser(user) ? '/admin' : '/profile')
    }
  }

  const handleViewAllPages = () => {
    onClose()
    navigate('/staff/fanpages')
  }

  if (accountPicker)
    return (
      <div className="flex flex-col gap-3" role="menu" aria-label="Chọn tài khoản và fanpage">
        <div className="flex flex-col gap-1 rounded-xl border border-border p-2">
          <Button
            variant="ghost"
            role="menuitem"
            onClick={onClose}
            className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal p-3 text-left"
            aria-label={`Đang dùng tài khoản ${displayName}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            <span className="min-w-0 flex-1 break-words text-sm font-semibold">{displayName}</span>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          </Button>
          {allFanpages.map((fp) => (
            <Button
              key={fp.id}
              variant="ghost"
              role="menuitem"
              aria-label={`Chuyển sang ${fp.name}`}
              onClick={() => handleSwitchToFanpage(fp)}
              className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal p-3 text-left"
            >
              <SwitchAvatar avatarUrl={fp.avatarUrl} name={fp.name} />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium">{fp.name}</span>
                <span className="mt-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                  Fanpage
                </span>
              </span>
            </Button>
          ))}
          <Button
            variant="ghost"
            role="menuitem"
            className="h-auto min-h-16 justify-start gap-3 p-3"
            onClick={() => {
              onClose()
              navigate('/register/fanpage')
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5" />
            </span>
            Đăng ký fanpage
          </Button>
        </div>
        <Button variant="ghost" role="menuitem" className="h-11 gap-2" onClick={handleViewAllPages}>
          <Users className="h-4 w-4" />
          Xem tất cả fanpage
        </Button>
      </div>
    )

  return (
    <div
      ref={popupRef}
      className={`${embedded ? 'relative w-full rounded-xl border border-border bg-card p-2' : 'student-account-popover absolute right-3 sm:right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-32px)] max-h-[calc(100dvh-96px)] overflow-y-auto overscroll-contain rounded-xl border border-[#E1E7EF] dark:border-border bg-white dark:bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150'} text-left select-none ${className}`}
      role="menu"
      aria-orientation="vertical"
      aria-label="Tài khoản và fanpage"
    >
      {/* =========================================================================
          TRƯỜNG HỢP 1: ĐANG Ở TRONG KHÔNG GIAN FANPAGE WORKSPACE
          - Hiển thị thông tin Fanpage hiện tại đang dùng ở trên cùng
          - Nếu là sinh viên: Nút chuyển lại tài khoản sinh viên có avatar tròn và mũi tên chuyển đổi, click quay lại trang chủ sinh viên '/'
          - Nếu là cán bộ: Nút quay lại Trung tâm quản lý Fanpage '/staff/fanpages'
          - Danh sách các fanpage khác có thể chuyển đổi
         ========================================================================= */}
      {isFanpageWorkspace ? (
        <>
          {/* Thông tin tài khoản cá nhân & Fanpage đang quản lý với logo fanpage nhỏ dưới avatar */}
          <Tooltip content="Xem thông tin cá nhân">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleGoToProfile}
              className="w-full h-auto min-h-10 shrink-0 whitespace-normal justify-start flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:ring-primary focus-visible:ring-offset-2"
              role="menuitem"
            >
              {/* Avatar cá nhân với logo fanpage nhỏ ở góc dưới */}
              <div className="relative shrink-0 w-12 h-12">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-border/60 bg-[#1B4B8A] text-white shadow-xs">
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

                {/* Logo fanpage hiện tại nhỏ ở góc dưới avatar (kích thước 20px rõ nét) */}
                {currentFanpage?.avatarUrl ? (
                  <Tooltip content={`Fanpage: ${currentFanpage.name}`}>
                    <img
                      src={currentFanpage.avatarUrl}
                      alt={currentFanpage.name}
                      className="absolute -bottom-1 -right-1 w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-full object-cover border-2 border-white dark:border-card shadow-xs"
                    />
                  </Tooltip>
                ) : (
                  <Tooltip content={`Fanpage: ${currentFanpage?.name}`}>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-full bg-[#374151] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-card shadow-xs">
                      <FanpageIcon className="h-2.5 w-2.5" aria-hidden="true" />
                    </div>
                  </Tooltip>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isStudent ? (
                  <>
                    <Tooltip content={currentFanpage?.name}>
                      <span className="font-medium text-sm text-foreground line-clamp-2 break-words">
                        {currentFanpage?.name || 'Không gian Fanpage'}
                      </span>
                    </Tooltip>
                    <span className="text-[11px] font-normal text-muted-foreground block truncate">
                      {currentFanpage?.role || currentFanpageRole || 'Quản trị viên'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-medium text-sm text-foreground">
                        {displayName}
                      </span>
                    </div>
                    <Tooltip content={currentFanpage?.name}>
                      <span className="font-medium text-xs text-foreground/90 block truncate">
                        {currentFanpage?.name || 'Không gian Fanpage'}
                      </span>
                    </Tooltip>
                    <span className="text-[11px] font-normal text-muted-foreground block truncate">
                      {currentFanpage?.role || currentFanpageRole || 'Quản trị viên'}
                    </span>
                  </>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </Tooltip>

          <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />

          {/* Danh sách các fanpage khác có thể chuyển sang */}
          {(availableSwitchFanpages.length > 0 || isStudent) && (
            <>
              <div className="flex min-h-0 max-h-[40dvh] flex-col gap-1 overflow-y-auto overscroll-contain">
                {availableSwitchFanpages.length > 0 && (
                  <div className="px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Chuyển sang fanpage
                    </span>
                  </div>
                )}

                {/* Các Fanpage khác mà user có quyền quản lý/tham gia */}
                {visibleSwitchFanpages.map((fp) => (
                  <Tooltip content={`Chuyển sang ${fp.name}`} key={fp.id}>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleSwitchToFanpage(fp)}
                      className="w-full h-auto min-h-10 shrink-0 whitespace-normal justify-start flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:ring-primary focus-visible:ring-offset-2 group"
                      role="menuitem"
                    >
                      <SwitchAvatar avatarUrl={fp.avatarUrl} name={fp.name} />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm text-foreground line-clamp-2 break-words group-hover:text-primary transition-colors">
                          {fp.name}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground block truncate">
                          {fp.role || (fp.isAdmin ? 'Quản trị viên' : 'Cộng tác viên')}
                        </span>
                      </div>
                    </Button>
                  </Tooltip>
                ))}

                {/* Chuyển lại tài khoản sinh viên (nếu là sinh viên) */}
                {isStudent && (
                  <Tooltip content="Quay lại trang chủ sinh viên">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate('/')
                      }}
                      className="w-full h-auto min-h-10 shrink-0 whitespace-normal justify-start flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:ring-primary focus-visible:ring-offset-2 group"
                      role="menuitem"
                    >
                      <SwitchAvatar
                        personal
                        avatarUrl={userAvatarUrl}
                        name={displayName}
                        bgClassName="bg-[#1B4B8A] text-white"
                        textClassName="text-[11px] font-bold text-white"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm text-foreground line-clamp-2 break-words group-hover:text-primary transition-colors">
                          {displayName}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground block truncate">
                          {studentMssv ? `MSSV: ${studentMssv} • Sinh viên` : 'Tài khoản sinh viên'}
                        </span>
                      </div>
                    </Button>
                  </Tooltip>
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
            - Danh sách các fanpage tham gia với nút chuyển có avatar tròn
           ========================================================================= */
        <>
          {/* Thẻ tài khoản cá nhân hiện tại */}
          <Tooltip content="Nhấn để xem thông tin cá nhân">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleGoToProfile}
              className="w-full h-auto min-h-10 shrink-0 whitespace-normal justify-start flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:ring-primary focus-visible:ring-offset-2"
              role="menuitem"
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
                <span className="font-medium text-sm text-foreground line-clamp-2 break-words">
                  {displayName}
                </span>
                {displaySubtitle && (
                  <span className="font-normal text-xs text-muted-foreground block truncate">
                    {displaySubtitle}
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </Tooltip>

          <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />

          {/* Danh sách Fanpage tham gia (Admin hoặc Cộng tác viên) với avatar tròn */}
          {isFanpagesError && allFanpages.length === 0 ? (
            <div className="px-2 py-2 space-y-1.5" role="alert">
              <p className="text-xs text-destructive">Không tải được danh sách fanpage.</p>
              <button
                type="button"
                onClick={() => void refetchDbFanpages()}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Thử lại
              </button>
              <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />
            </div>
          ) : (
            allFanpages.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Chuyển sang fanpage
                </div>
                <div className="flex min-h-0 max-h-[40dvh] flex-col gap-1 overflow-y-auto overscroll-contain">
                  {visibleSwitchFanpages.map((fp) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      key={fp.id}
                      type="button"
                      onClick={() => handleSwitchToFanpage(fp)}
                      className="w-full h-auto min-h-10 shrink-0 whitespace-normal justify-start flex items-center gap-3 p-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:ring-primary focus-visible:ring-offset-2 group"
                      role="menuitem"
                    >
                      <SwitchAvatar avatarUrl={fp.avatarUrl} name={fp.name} />

                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm text-foreground line-clamp-2 break-words group-hover:text-primary transition-colors">
                          {fp.name}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground block truncate">
                          {fp.role || (fp.isAdmin ? 'Quản trị viên' : 'Cộng tác viên')}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="w-full h-px bg-[#EDF0F4] dark:bg-border/60 my-2" />
              </>
            )
          )}
        </>
      )}

      {/* =========================================================================
          HÀNH ĐỘNG CHUNG: XEM TẤT CẢ TRANG & ĐĂNG XUẤT
          - Đã bỏ nút "Về trang chủ sinh viên" khi đang ở trang chủ sinh viên
         ========================================================================= */}
      <div className="flex flex-col gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleViewAllPages}
          className="w-full h-10 px-3 rounded-lg border border-border bg-transparent hover:bg-muted text-foreground font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          role="menuitem"
        >
          <Users className="w-4 h-4 text-foreground shrink-0" />
          <span>Xem tất cả fanpage</span>
        </Button>
      </div>

      <div className="pt-2 border-t border-[#EDF0F4] dark:border-border/60 mt-2">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            onClose()
            onLogout()
          }}
          className="w-full h-10 px-3 rounded-lg text-rose-600 focus-visible:ring-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium text-xs cursor-pointer flex items-center justify-center gap-2 group"
          role="menuitem"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </div>
  )
}

export default AccountNavigationPopup
