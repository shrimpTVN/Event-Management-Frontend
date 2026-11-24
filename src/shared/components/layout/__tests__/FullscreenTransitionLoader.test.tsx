import { beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router-dom'
import { FullscreenTransitionLoader } from '../FullscreenTransitionLoader'
import { useAuthStore } from '@/features/auth/store/authStore'
import { triggerMajorTransition } from '@/shared/store/pageTransitionStore'

vi.mock('@/shared/store/pageTransitionStore', () => ({
  usePageTransitionStore: () => ({ isOpen: false }),
  triggerMajorTransition: vi.fn(),
}))

beforeEach(() => {
  useAuthStore.getState().clearAuth()
  vi.clearAllMocks()
})
function show() {
  render(
    <MemoryRouter initialEntries={['/events/19']}>
      <FullscreenTransitionLoader />
      <Link to="/login">Login</Link>
    </MemoryRouter>
  )
}
it('does not announce logout when a guest is redirected to login', () => {
  show()
  fireEvent.click(screen.getByRole('link', { name: 'Login' }))
  expect(triggerMajorTransition).not.toHaveBeenCalled()
})
it('announces logout when an existing session is cleared', () => {
  useAuthStore.setState({ isAuthenticated: true })
  show()
  act(() => useAuthStore.getState().clearAuth())
  fireEvent.click(screen.getByRole('link', { name: 'Login' }))
  expect(triggerMajorTransition).toHaveBeenCalledWith(
    'Đang đăng xuất...',
    'Hẹn gặp lại bạn trên CTU Event',
    400
  )
})
