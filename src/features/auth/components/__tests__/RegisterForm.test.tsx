import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { authService } from '../../services/authService'
import { RegisterForm } from '../RegisterForm'

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
  },
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
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
})
