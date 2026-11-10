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
})

