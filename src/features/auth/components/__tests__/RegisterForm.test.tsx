import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { authService } from '../../services/authService'
import { RegisterForm } from '../RegisterForm'
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
    sendOtp: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    exchangeGoogleToken: vi.fn(),
  },
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    sessionStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders fullName, email, password and confirmPassword fields', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/Ví dụ: Nguyễn Văn A/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/example@student.ctu.edu.vn/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^Nhập mật khẩu$/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^Nhập lại mật khẩu$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Đăng ký$/i })).toBeInTheDocument()
  })

  it('submits form with valid data, stores pending_registration, sends OTP and navigates', async () => {
    vi.mocked(authService.sendOtp).mockResolvedValueOnce(true)

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText(/Ví dụ: Nguyễn Văn A/i)
    const emailInput = screen.getByPlaceholderText(/example@student.ctu.edu.vn/i)
    const passwordInput = screen.getByPlaceholderText(/^Nhập mật khẩu$/i)
    const confirmInput = screen.getByPlaceholderText(/^Nhập lại mật khẩu$/i)

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn An' } })
    fireEvent.change(emailInput, { target: { value: 'anb2301111@student.ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'Password123' } })
    fireEvent.change(confirmInput, { target: { value: 'Password123' } })

    const submitBtn = screen.getByRole('button', { name: /^Đăng ký$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.sendOtp).toHaveBeenCalledWith('anb2301111@student.ctu.edu.vn')
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp?email=anb2301111%40student.ctu.edu.vn')

      const pending = JSON.parse(sessionStorage.getItem('pending_registration') || '{}')
      expect(pending.fullName).toBe('Nguyễn Văn An')
      expect(pending.firstName).toBe('Văn An')
      expect(pending.lastName).toBe('Nguyễn')
      expect(pending.email).toBe('anb2301111@student.ctu.edu.vn')
      expect(pending.password).toBe('Password123')
    })
  })

  it('validates mismatched passwords and displays error', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText(/Ví dụ: Nguyễn Văn A/i)
    const emailInput = screen.getByPlaceholderText(/example@student.ctu.edu.vn/i)
    const passwordInput = screen.getByPlaceholderText(/^Nhập mật khẩu$/i)
    const confirmInput = screen.getByPlaceholderText(/^Nhập lại mật khẩu$/i)

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn An' } })
    fireEvent.change(emailInput, { target: { value: 'anb2301111@student.ctu.edu.vn' } })
    fireEvent.change(passwordInput, { target: { value: 'Password123' } })
    fireEvent.change(confirmInput, { target: { value: 'Password456' } })

    const submitBtn = screen.getByRole('button', { name: /^Đăng ký$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument()
      expect(authService.sendOtp).not.toHaveBeenCalled()
    })
  })

  it('creates a mock Google session before navigating to onboarding', async () => {
    vi.stubEnv('MODE', 'mock')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    vi.mocked(authService.exchangeGoogleToken).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'loc@student.ctu.edu.vn',
        name: 'Sinh viên CTU',
        role: 'STUDENT',
        createdAt: '2026-01-01T00:00:00Z',
        isProfileComplete: false,
      },
      tokens: { accessToken: 'mock-jwt-token-1' },
    } as any)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký bằng Google' }))

    await waitFor(() => {
      expect(authService.exchangeGoogleToken).toHaveBeenCalledWith({
        idToken: expect.stringMatching(/^mock-google-token-/),
      })
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/student', { replace: true })
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('shows inline email error and stays on /register when sendOtp rejects with AUTH.003', async () => {
    vi.mocked(authService.sendOtp).mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          exceptionCode: 'AUTH.003',
          message: 'User with email existing@student.ctu.edu.vn already exists.',
        },
      },
    })

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: Nguyễn Văn A/i), {
      target: { value: 'Nguyễn Văn An' },
    })
    fireEvent.change(screen.getByPlaceholderText(/example@student.ctu.edu.vn/i), {
      target: { value: 'Existing@student.ctu.edu.vn' },
    })
    fireEvent.change(screen.getByPlaceholderText(/^Nhập mật khẩu$/i), {
      target: { value: 'Password123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/^Nhập lại mật khẩu$/i), {
      target: { value: 'Password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^Đăng ký$/i }))

    await waitFor(() => {
      expect(authService.sendOtp).toHaveBeenCalledWith('existing@student.ctu.edu.vn')
      expect(
        screen.getByText('Email này đã được đăng ký trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác.')
      ).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
