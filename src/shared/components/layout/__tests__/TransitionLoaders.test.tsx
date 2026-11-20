import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { RootLayout } from '../RootLayout'
import { usePageTransitionStore, triggerMajorTransition } from '@/shared/store/pageTransitionStore'

describe('TransitionLoaders (Option 3 Hybrid)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    usePageTransitionStore.setState({
      isOpen: false,
      isFadingOut: false,
      title: 'Đang tải...',
      subtitle: 'Hệ thống Quản lý Sự kiện CTU Event',
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders RootLayout with child outlet correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>Hello World Child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Hello World Child')).toBeInTheDocument()
  })

  it('shows and hides FullscreenTransitionLoader when triggerMajorTransition is called', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Đang mở không gian Fanpage...')).not.toBeInTheDocument()

    act(() => {
      triggerMajorTransition('Đang mở không gian Fanpage...', 'CTU Event Workspace', 400)
    })

    expect(screen.getByText('Đang mở không gian Fanpage...')).toBeInTheDocument()
    expect(screen.getByText('CTU Event Workspace')).toBeInTheDocument()

    // Sau duration (400ms), bắt đầu fade-out
    act(() => {
      vi.advanceTimersByTime(400)
    })
    // Sau fade-out (300ms nữa), biến mất
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.queryByText('Đang mở không gian Fanpage...')).not.toBeInTheDocument()
  })

  it('automatically triggers FullscreenTransitionLoader when navigating from /login to an app route', () => {
    const TestComponent = () => {
      const navigate = useNavigate()
      return (
        <div>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/login" element={<TestComponent />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    act(() => {
      screen.getByText('Go to Home').click()
    })

    // Khi chuyển từ auth sang trang chủ, FullscreenTransitionLoader tự động xuất hiện
    expect(screen.getByText('Đang vào hệ thống...')).toBeInTheDocument()
    expect(screen.getByText('Chào mừng bạn đến với CTU Event')).toBeInTheDocument()

    // Chạy hết animation
    act(() => {
      vi.advanceTimersByTime(850)
    })
    expect(screen.queryByText('Đang vào hệ thống...')).not.toBeInTheDocument()
  })
})
