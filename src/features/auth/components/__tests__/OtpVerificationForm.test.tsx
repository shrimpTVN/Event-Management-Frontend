import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { OtpVerificationForm } from '../OtpVerificationForm'

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
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
  },
}))

describe('OtpVerificationForm navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('navigates student to /onboarding/student immediately after OTP verification', async () => {
    vi.mocked(authService.verifyOtp).mockResolvedValueOnce({
      success: true,
      user: {
        id: '1',
        email: 'student@student.ctu.edu.vn',
        name: 'Sinh vien CTU',
        role: 'STUDENT',
        isProfileComplete: false,
      } as any,
    } as any)

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=student@student.ctu.edu.vn']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)

    // Fill OTP digits
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } })
    })

    const submitBtn = screen.getByRole('button', { name: /Xác thực/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith({
        email: 'student@student.ctu.edu.vn',
        otp: '123456',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/student', { replace: true })
    })
  })

  it('navigates staff to /onboarding/staff immediately after OTP verification', async () => {
    vi.mocked(authService.verifyOtp).mockResolvedValueOnce({
      success: true,
      user: {
        id: '2',
        email: 'canbo@ctu.edu.vn',
        name: 'Can Bo CTU',
        role: 'FANPAGE_ADMIN',
        isProfileComplete: false,
      } as any,
    } as any)

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=canbo@ctu.edu.vn']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } })
    })

    const submitBtn = screen.getByRole('button', { name: /Xác thực/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith({
        email: 'canbo@ctu.edu.vn',
        otp: '123456',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/staff', { replace: true })
    })
  })

  it('completes student registration and auto-logins when pending registration exists in sessionStorage', async () => {
    sessionStorage.setItem(
      'pending_registration',
      JSON.stringify({
        email: 'student@student.ctu.edu.vn',
        password: 'Password123',
        fullName: 'Nguyễn Văn An',
        firstName: 'Văn An',
        lastName: 'Nguyễn',
      })
    )

    vi.mocked(authService.register).mockResolvedValueOnce({
      success: true,
      email: 'student@student.ctu.edu.vn',
    })

    vi.mocked(authService.login).mockResolvedValueOnce({
      user: {
        id: '10',
        email: 'student@student.ctu.edu.vn',
        name: 'Nguyễn Văn An',
        role: 'STUDENT',
        isProfileComplete: false,
      } as any,
      tokens: { accessToken: 'jwt-test-token' },
    } as any)

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=student@student.ctu.edu.vn']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } })
    })

    const submitBtn = screen.getByRole('button', { name: /Xác thực/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'student@student.ctu.edu.vn',
        password: 'Password123',
        otpCode: '123456',
        firstName: 'Văn An',
        lastName: 'Nguyễn',
      })
      expect(authService.login).toHaveBeenCalledWith({
        email: 'student@student.ctu.edu.vn',
        password: 'Password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/student', { replace: true })
      expect(sessionStorage.getItem('pending_registration')).toBeNull()
    })
  })

  it('completes staff registration via register + login and routes to /onboarding/staff', async () => {
    sessionStorage.setItem(
      'pending_registration',
      JSON.stringify({
        email: 'lecturer@ctu.edu.vn',
        password: 'Password123',
        fullName: 'Trần Minh',
        firstName: 'Minh',
        lastName: 'Trần',
      })
    )

    vi.mocked(authService.register).mockResolvedValueOnce({
      success: true,
      email: 'lecturer@ctu.edu.vn',
    })

    vi.mocked(authService.login).mockResolvedValueOnce({
      user: {
        id: '20',
        email: 'lecturer@ctu.edu.vn',
        name: 'Trần Minh',
        role: 'FANPAGE_ADMIN',
        roles: ['FANPAGE_ADMIN'],
        isProfileComplete: false,
      } as any,
      tokens: {},
    } as any)

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=lecturer@ctu.edu.vn']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } })
    })

    fireEvent.click(screen.getByRole('button', { name: /Xác thực/i }))

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'lecturer@ctu.edu.vn',
        password: 'Password123',
        otpCode: '123456',
        firstName: 'Minh',
        lastName: 'Trần',
      })
      expect(authService.login).toHaveBeenCalledWith({
        email: 'lecturer@ctu.edu.vn',
        password: 'Password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/staff', { replace: true })
      expect(sessionStorage.getItem('pending_registration')).toBeNull()
    })
  })

  it('does not fabricate a fake auth session when pending registration is missing and verifyOtp returns boolean', async () => {
    sessionStorage.removeItem('pending_registration')
    vi.mocked(authService.verifyOtp).mockResolvedValueOnce(true as any)

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=student@student.ctu.edu.vn']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } })
    })

    fireEvent.click(screen.getByRole('button', { name: /Xác thực/i }))

    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalled()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('disables OTP actions and does not fall back to a dummy email when ?email= is missing', () => {
    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <OtpVerificationForm />
      </MemoryRouter>
    )

    expect(screen.queryByText('user@student.ctu.edu.vn')).not.toBeInTheDocument()
    expect(screen.getByText(/Thiếu địa chỉ email cần xác thực/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Xác thực/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Gửi lại mã/i })).toBeDisabled()
  })
})

