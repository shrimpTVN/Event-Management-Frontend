import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { apiClient } from '@/shared/services/api'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { RoleEnum } from '../../types/auth.types'
import { StaffFanpageHub } from '../StaffFanpageHub'

// Mock apiClient at source
vi.mock('@/shared/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setAuthTokenGetter: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

describe('StaffFanpageHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('renders correctly with loaded fanpages', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('invitations')) {
        return Promise.resolve([])
      }
      return Promise.resolve([
        {
          id: '101',
          code: 'TEST',
          name: 'Fanpage Thử Nghiệm API',
          role: 'Quản trị viên',
          permissions: 'Toàn quyền',
        },
      ])
    })

    render(
      <AppProviders>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </AppProviders>
    )

    expect(screen.getByText(/Chọn fanpage để quản lý sự kiện/i)).toBeInTheDocument()
    expect(await screen.findByText('Fanpage Thử Nghiệm API')).toBeInTheDocument()
    expect(screen.getByText(/Fanpage đang quản trị \(1\)/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Đăng xuất khỏi hệ thống/i)).toBeInTheDocument()
  })

  it('renders empty state when staff has no fanpages yet', async () => {
    vi.mocked(apiClient.get).mockImplementation(() => Promise.resolve([]))

    render(
      <AppProviders>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </AppProviders>
    )

    expect(await screen.findByText(/Hiện tại bạn chưa có fanpage nào/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Tài khoản cán bộ của bạn hiện chưa tham gia hoặc sở hữu fanpage nào/i
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đăng ký tạo fanpage ngay/i })).toBeInTheDocument()
  })

  it('handles logout when clicking logout button', async () => {
    vi.mocked(apiClient.get).mockImplementation(() => Promise.resolve([]))
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue()
    useAuthStore.getState().setAuth(
      {
        id: 'usr-staff-1',
        email: 'staff@ctu.edu.vn',
        name: 'Cán bộ mẫu',
        role: RoleEnum.FANPAGE_ADMIN,
        createdAt: new Date().toISOString(),
      },
      'mock-jwt-token'
    )

    render(
      <AppProviders>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </AppProviders>
    )

    const logoutBtn = screen.getByTitle(/Đăng xuất khỏi hệ thống/i)
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
