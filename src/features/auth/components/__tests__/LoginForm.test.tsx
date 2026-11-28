import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from '../LoginForm'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    exchangeGoogleToken: vi.fn(),
  },
}))

describe('LoginForm error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    useAuthStore.getState().clearAuth()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('shows the generic credential error when an email is not registered', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          exceptionCode: 'AUTH.005',
          message: 'Invalid username or password',
        },
      },
    })

    renderComponent()

    const emailInput = screen.getByPlaceholderText('example@student.ctu.edu.vn hoặc @ctu.edu.vn')
    const passwordInput = screen.getByPlaceholderText('Vui lòng nhập mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    // organize@ctu.edu.vn is NOT in the system
    fireEvent.change(emailInput, { target: { value: 'organize@ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'somepass123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu không đúng.')).toBeInTheDocument()
    })

    expect(screen.queryByText('Email không tồn tại trong hệ thống.')).toBeNull()
    expect(screen.queryByText('Invalid username or password')).toBeNull()
  })

  it('shows the same credential error when the password is wrong', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          exceptionCode: 'AUTH.005',
          message: 'Invalid username or password',
        },
      },
    })

    renderComponent()

    const emailInput = screen.getByPlaceholderText('example@student.ctu.edu.vn hoặc @ctu.edu.vn')
    const passwordInput = screen.getByPlaceholderText('Vui lòng nhập mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    // organizer@ctu.edu.vn IS in the system, password is wrong
    fireEvent.change(emailInput, { target: { value: 'organizer@ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu không đúng.')).toBeInTheDocument()
    })

    expect(screen.queryByText('Mật khẩu không chính xác. Vui lòng kiểm tra lại.')).toBeNull()
    expect(screen.queryByText('Invalid username or password')).toBeNull()
  })

  it('does not reveal account existence when backend returns a user-not-found message', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'User not found with email: nonexist@ctu.edu.vn',
        },
      },
    })

    renderComponent()

    const emailInput = screen.getByPlaceholderText('example@student.ctu.edu.vn hoặc @ctu.edu.vn')
    const passwordInput = screen.getByPlaceholderText('Vui lòng nhập mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'nonexist@ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'somepass123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu không đúng.')).toBeInTheDocument()
    })

    expect(screen.queryByText(/User not found with email/)).toBeNull()
  })

  it('clears the credential error when the user edits the input', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          exceptionCode: 'AUTH.005',
          message: 'Invalid username or password',
        },
      },
    })

    renderComponent()

    const emailInput = screen.getByPlaceholderText('example@student.ctu.edu.vn hoặc @ctu.edu.vn')
    const passwordInput = screen.getByPlaceholderText('Vui lòng nhập mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'organize@ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu không đúng.')).toBeInTheDocument()
    })

    fireEvent.change(emailInput, { target: { value: 'organize_corrected@ctu.edu.vn' } })
    expect(screen.queryByText('Email hoặc mật khẩu không đúng.')).toBeNull()
  })

  it('shows a configuration error without calling an auth endpoint when Google client ID is missing', () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')

    renderComponent()

    expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeDisabled()
    expect(screen.getByText(/thiếu VITE_GOOGLE_CLIENT_ID/)).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
    expect(authService.exchangeGoogleToken).not.toHaveBeenCalled()
  })

  it('uses the Google endpoint in mock mode without requiring email or password', async () => {
    vi.stubEnv('MODE', 'mock')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    vi.mocked(authService.exchangeGoogleToken).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'loc@student.ctu.edu.vn',
        name: 'Sinh viên CTU',
        role: 'STUDENT',
        createdAt: '2026-01-01T00:00:00Z',
        isProfileComplete: true,
      },
      tokens: { accessToken: 'mock-jwt-token-1' },
    } as any)

    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }))

    await waitFor(() => {
      expect(authService.exchangeGoogleToken).toHaveBeenCalledWith({
        idToken: expect.stringMatching(/^mock-google-token-/),
      })
    })
    expect(authService.login).not.toHaveBeenCalled()
    expect(screen.queryByText('Vui lòng nhập email')).toBeNull()
  })

  it('navigates directly to /admin when logging in as superadmin with a dedicated non-ctu email', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      user: {
        id: '3',
        email: 'superadmin@gmail.com',
        name: 'Quản Trị Hệ Thống',
        role: 'ADMIN' as any,
        roles: ['ROLE_ADMIN'],
        createdAt: '2026-01-01T00:00:00Z',
        isProfileComplete: true,
      },
      tokens: {
        accessToken: 'mock-jwt-superadmin',
      },
    } as any)

    renderComponent()

    const emailInput = screen.getByPlaceholderText('example@student.ctu.edu.vn hoặc @ctu.edu.vn')
    const passwordInput = screen.getByPlaceholderText('Vui lòng nhập mật khẩu')
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' })

    fireEvent.change(emailInput, { target: { value: 'superadmin@gmail.com' } })
    fireEvent.change(passwordInput, { target: { value: '123123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true })
    })
  })
})
