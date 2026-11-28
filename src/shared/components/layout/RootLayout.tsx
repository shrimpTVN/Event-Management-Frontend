import React, { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { apiClient } from '@/shared/services/api'
import { isMockMode } from '@/shared/utils/env'
import { useAuthStore } from '@/features/auth/store/authStore'
import { TopProgressBar } from './TopProgressBar'
import { FullscreenTransitionLoader } from './FullscreenTransitionLoader'

/**
 * RootLayout — layout gốc bao toàn bộ ứng dụng.
 * Tích hợp Phương án 3 (Hybrid):
 * 1. TopProgressBar: Thanh tiến trình mỏng trên đỉnh màn hình cho các route chuyển đổi thông thường.
 * 2. FullscreenTransitionLoader: Màn hình loading chuyển tiếp toàn trang cho các bước lớn
 *    (Đăng nhập -> Trang chủ, Đăng xuất, Mở/Đổi Fanpage workspace, Vào Super Admin).
 */
export const RootLayout: React.FC = () => {
  const verifiedBootRef = useRef(false)

  useEffect(() => {
    if (verifiedBootRef.current || isMockMode() || import.meta.env.MODE === 'test') {
      return
    }
    verifiedBootRef.current = true
    const state = useAuthStore.getState()
    if (!state.isAuthenticated || !state.user) {
      return
    }
    // Validate hydrated local session against real backend cookie once on app mount.
    apiClient.get('/users/me/profile').catch(() => undefined)
  }, [])

  return (
    <>
      <TopProgressBar />
      <FullscreenTransitionLoader />
      <Outlet />
    </>
  )
}
