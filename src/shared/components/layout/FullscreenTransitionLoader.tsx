import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import ctuLogo from '@/assets/CTU_logo.png'
import { usePageTransitionStore, triggerMajorTransition } from '@/shared/store/pageTransitionStore'
import { useAuthStore } from '@/features/auth/store/authStore'

const AUTH_PATHS = ['/login', '/register', '/dang-nhap', '/dang-ky', '/verify-otp']
const ADMIN_PATHS = ['/admin', '/super-admin']

/**
 * Kiểm tra xem đường dẫn có phải là không gian Quản trị Fanpage / Ban tổ chức hay không.
 * Các trang chi tiết Fanpage công khai của sinh viên (/fanpage, /fanpage/:id, /fanpages/:id)
 * là trang xem bình thường, KHÔNG hiện màn hình loading lớn toàn trang.
 */
const isFanpageWorkspacePath = (path: string): boolean => {
  return (
    path.startsWith('/fanpage/admin') ||
    path.startsWith('/fanpage/workspace') ||
    path.startsWith('/fanpage/manage') ||
    path.startsWith('/admin/fanpage') ||
    path.startsWith('/fanpage-admin') ||
    path.startsWith('/staff/fanpages') ||
    path.startsWith('/dang-ky-fanpage') ||
    path.startsWith('/register/fanpage')
  )
}

export const FullscreenTransitionLoader: React.FC = () => {
  const location = useLocation()
  const { isOpen, isFadingOut, title, subtitle } = usePageTransitionStore()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hadSessionRef = useRef(isAuthenticated)

  const currentFanpageId = (location.state as any)?.fanpageId
    ? String((location.state as any)?.fanpageId)
    : null

  const prevPathRef = useRef<string>(location.pathname)
  const prevFanpageIdRef = useRef<string | null>(currentFanpageId)

  useEffect(() => {
    const prev = prevPathRef.current
    const curr = location.pathname
    if (isAuthenticated) hadSessionRef.current = true

    if (prev === curr && prevFanpageIdRef.current === currentFanpageId) {
      return
    }

    const wasAuth = AUTH_PATHS.some((p) => prev.startsWith(p))
    const isNowAuth = AUTH_PATHS.some((p) => curr.startsWith(p))
    const wasFanpageWorkspace = isFanpageWorkspacePath(prev)
    const isNowFanpageWorkspace = isFanpageWorkspacePath(curr)
    const wasAdmin = ADMIN_PATHS.some((p) => prev.startsWith(p))
    const isNowAdmin = ADMIN_PATHS.some((p) => curr.startsWith(p))

    // 1. Chuyển từ Auth sang ứng dụng (Đăng nhập / Đăng ký thành công)
    if (wasAuth && !isNowAuth && isAuthenticated) {
      triggerMajorTransition('Đang vào hệ thống...', 'Chào mừng bạn đến với CTU Event', 500)
    }
    // 2. Chuyển từ ứng dụng về Auth (Đăng xuất)
    else if (!wasAuth && isNowAuth && hadSessionRef.current) {
      triggerMajorTransition('Đang đăng xuất...', 'Hẹn gặp lại bạn trên CTU Event', 400)
    }
    // 3. Chuyển vào không gian Quản trị Fanpage / Ban tổ chức
    else if (!wasFanpageWorkspace && isNowFanpageWorkspace && isAuthenticated) {
      triggerMajorTransition('Đang mở không gian Fanpage...', 'CTU Event Organizer Workspace', 500)
    }
    // 4. Chuyển đổi giữa 2 Fanpage khác nhau trong workspace ban tổ chức
    else if (
      isNowFanpageWorkspace &&
      isAuthenticated &&
      currentFanpageId &&
      prevFanpageIdRef.current &&
      currentFanpageId !== prevFanpageIdRef.current
    ) {
      triggerMajorTransition('Đang chuyển đổi Fanpage...', 'Đang tải dữ liệu ban tổ chức', 450)
    }
    // 5. Chuyển vào cổng Quản trị viên cấp cao (Super Admin)
    else if (!wasAdmin && isNowAdmin && isAuthenticated) {
      triggerMajorTransition(
        'Đang chuyển đến cổng Super Admin...',
        'Hệ thống Quản lý Sự kiện CTU Event',
        500
      )
    }

    prevPathRef.current = curr
    prevFanpageIdRef.current = currentFanpageId
    hadSessionRef.current = isAuthenticated
  }, [location.pathname, currentFanpageId, isAuthenticated])

  if (!isOpen) return null

  return (
    <aside
      aria-label="Đang chuyển trang"
      aria-modal="true"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Hiển thị liền mạch toàn màn hình, không đóng khung card */}
      <div className="flex flex-col items-center text-center px-4 max-w-sm">
        {/* CTU Logo từ CTU_logo.png */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl animate-pulse" />
          <img
            src={ctuLogo}
            alt="Đại học Cần Thơ"
            className="h-20 w-20 md:h-24 md:w-24 object-contain relative z-10 drop-shadow-sm animate-pulse"
          />
        </div>

        {/* Circular Dual-ring Spinner */}
        <div className="relative w-7 h-7 mb-3.5">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1F5CA9] border-r-[#3B82F6] animate-spin" />
        </div>

        {/* Tiêu đề trạng thái chuyển trang */}
        <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>
    </aside>
  )
}
