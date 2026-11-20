import React from 'react'
import { Outlet } from 'react-router-dom'
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
  return (
    <>
      <TopProgressBar />
      <FullscreenTransitionLoader />
      <Outlet />
    </>
  )
}
