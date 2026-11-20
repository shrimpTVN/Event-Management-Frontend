import React, { useEffect, useRef, useState, useContext } from 'react'
import { useLocation, UNSAFE_DataRouterStateContext } from 'react-router-dom'
import { usePageTransitionStore } from '@/shared/store/pageTransitionStore'

/**
 * useSafeNavigation — lấy trạng thái navigation từ data router nếu có,
 * fallback về { state: 'idle' } nếu render trong router thông thường (MemoryRouter trong test, v.v.)
 */
function useSafeNavigation() {
  const context = useContext(UNSAFE_DataRouterStateContext)
  return context?.navigation || { state: 'idle' }
}

/**
 * TopProgressBar — thanh loading mỏng ở đầu trang, hiện khi chuyển route thông thường.
 * Tự động hoàn tất (100% -> fade out) khi navigation idle hoặc sau khi route mount xong.
 * Có cơ chế failsafe đảm bảo không bao giờ bị đứng yên hay kẹt trên màn hình.
 */
export const TopProgressBar: React.FC = () => {
  const navigation = useSafeNavigation()
  const location = useLocation()

  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completing, setCompleting] = useState(false)

  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const prevLocationKeyRef = useRef<string>(
    location.key || `${location.pathname}${location.search}`
  )

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current = []
  }

  // Hàm hoàn tất thanh tiến trình và fade out
  const finishAndHide = () => {
    clearAllTimers()
    setProgress(100)
    setCompleting(true)

    const hideTimer = setTimeout(() => {
      setVisible(false)
      setProgress(0)
      setCompleting(false)
    }, 300)
    timeoutsRef.current.push(hideTimer)
  }

  // 1. Phản ứng với trạng thái navigation (nếu có loader)
  useEffect(() => {
    if (usePageTransitionStore.getState().isOpen) {
      setVisible(false)
      return
    }

    if (navigation.state === 'loading') {
      clearAllTimers()
      setCompleting(false)
      setVisible(true)
      setProgress(25)

      const t1 = setTimeout(() => setProgress(60), 100)
      const t2 = setTimeout(() => setProgress(85), 250)
      // Failsafe: tối đa 2.5s luôn tự động hoàn tất để không bao giờ bị đứng
      const tSafe = setTimeout(() => finishAndHide(), 2500)
      timeoutsRef.current.push(t1, t2, tSafe)
    } else if (navigation.state === 'idle' && visible && !completing) {
      finishAndHide()
    }
  }, [navigation.state])

  // 2. Phản ứng với mọi lần chuyển route (pathname, search hoặc navigation key)
  useEffect(() => {
    const currentKey = location.key || `${location.pathname}${location.search}`
    if (currentKey !== prevLocationKeyRef.current) {
      prevLocationKeyRef.current = currentKey

      // Nếu đang mở FullscreenTransitionLoader (chuyển cảnh lớn), không hiển thị thanh top
      if (usePageTransitionStore.getState().isOpen) {
        setVisible(false)
        return
      }

      clearAllTimers()
      setCompleting(false)
      setVisible(true)
      setProgress(30)

      // Chạy mượt lên 80% rồi kết thúc 100% và biến mất
      const t1 = setTimeout(() => setProgress(80), 80)
      const t2 = setTimeout(() => {
        setProgress(100)
        setCompleting(true)
      }, 180)
      const t3 = setTimeout(() => {
        setVisible(false)
        setProgress(0)
        setCompleting(false)
      }, 450)

      timeoutsRef.current.push(t1, t2, t3)
    }
  }, [location.pathname, location.search, location.key])

  // Cleanup khi unmount
  useEffect(() => () => clearAllTimers(), [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        height: '3px',
        pointerEvents: 'none',
      }}
    >
      {/* Thanh tiến trình chính */}
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1F5CA9 0%, #3B82F6 50%, #60A5FA 100%)',
          transition: completing
            ? 'width 0.2s ease-out, opacity 0.2s ease 0.15s'
            : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: completing && progress >= 100 ? 0 : 1,
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.7)',
          borderRadius: '0 2px 2px 0',
        }}
      />

      {/* Hiệu ứng lấp lánh chạy dọc thanh */}
      {!completing && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '60px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'progress-shimmer 1.2s infinite',
            transform: `translateX(calc(${progress}% - 60px))`,
          }}
        />
      )}
    </div>
  )
}
