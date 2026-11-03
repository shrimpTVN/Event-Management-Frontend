import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  },
}))

describe('LoginForm error handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('displays error ONLY under email when email does not exist in system (e.g. organize@ctu.edu.vn)', async () => {
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
      // Must show error under email
      expect(
        screen.getByText('Email không tồn tại trong hệ thống.')
      ).toBeInTheDocument()
    })

    // Must NOT show error under password
    expect(
      screen.queryByText('Mật khẩu không chính xác. Vui lòng kiểm tra lại.')
    ).toBeNull()

    // The generic English alert banner should NOT appear
    expect(screen.queryByText('Invalid username or password')).toBeNull()
  })

  it('displays error ONLY under password when email exists (e.g. organizer@ctu.edu.vn) but password is wrong', async () => {
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
      // Must show error under password
      expect(
        screen.getByText('Mật khẩu không chính xác. Vui lòng kiểm tra lại.')
      ).toBeInTheDocument()
    })

    // Must NOT show error under email
    expect(
      screen.queryByText('Email không tồn tại trong hệ thống.')
    ).toBeNull()
    expect(
      screen.queryByText('Email không tồn tại hoặc thông tin đăng nhập chưa đúng.')
    ).toBeNull()

    // Generic alert banner must not appear
    expect(screen.queryByText('Invalid username or password')).toBeNull()
  })

  it('displays user not found message under email input when backend explicitly returns user not found', async () => {
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
      expect(
        screen.getByText('Email không tồn tại trong hệ thống.')
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByText('Mật khẩu không chính xác. Vui lòng kiểm tra lại.')
    ).toBeNull()
  })

  it('clears field errors when the user edits the input', async () => {
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
      expect(
        screen.getByText('Email không tồn tại trong hệ thống.')
      ).toBeInTheDocument()
    })

    // Editing email input clears the error
    fireEvent.change(emailInput, { target: { value: 'organize_corrected@ctu.edu.vn' } })
    expect(
      screen.queryByText('Email không tồn tại trong hệ thống.')
    ).toBeNull()
  })
})
