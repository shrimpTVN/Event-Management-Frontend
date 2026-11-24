import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PasswordSettings } from '../PasswordSettings'
import { authService } from '../../services/authService'
vi.mock('../../services/authService', () => ({ authService: { createPassword: vi.fn(), changePassword: vi.fn(), logout: vi.fn(), getAccountSecurity: vi.fn() } }))
beforeEach(() => { vi.resetAllMocks(); vi.mocked(authService.logout).mockResolvedValue(undefined); vi.mocked(authService.getAccountSecurity).mockResolvedValue({ hasPassword: false }) })
function show() {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Routes><Route path="/" element={<PasswordSettings />} /><Route path="/login" element={<p>Đăng nhập lại</p>} /></Routes></MemoryRouter></QueryClientProvider>)
}
function enter(newPassword = 'secret123', confirmation = newPassword) {
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: newPassword } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: confirmation } })
}
it('checks confirmation before creating a password without an old password', async () => {
  show(); fireEvent.click(screen.getByRole('button', { name: 'Tạo mật khẩu lần đầu' }))
  enter('secret123', 'different123'); fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  expect(screen.getByRole('alert')).toHaveTextContent('chưa khớp')
  expect(authService.createPassword).not.toHaveBeenCalled()
  enter(); fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  await waitFor(() => expect(authService.createPassword).toHaveBeenCalledExactlyOnceWith('secret123'))
  expect(await screen.findByRole('status')).toHaveTextContent('Đã cập nhật mật khẩu')
  expect(authService.logout).not.toHaveBeenCalled()
})
it('switches to password change when the backend says a password already exists', async () => {
  vi.mocked(authService.createPassword).mockRejectedValue({ response: { data: { message: 'User already has a password set. Please use change-password instead.' } } })
  show(); fireEvent.click(screen.getByRole('button', { name: 'Tạo mật khẩu lần đầu' })); enter()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  expect(await screen.findByLabelText('Mật khẩu hiện tại')).toBeInTheDocument()
  expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('')
})
it('requires login again after password change because BE revokes refresh sessions', async () => {
  vi.mocked(authService.changePassword).mockResolvedValue(undefined)
  show(); fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' })); enter()
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'oldsecret' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  expect(await screen.findByText('Đăng nhập lại')).toBeInTheDocument()
  expect(authService.changePassword).toHaveBeenCalledExactlyOnceWith('oldsecret', 'secret123')
})

it('displays only change password when account already has password', async () => {
  vi.mocked(authService.getAccountSecurity).mockResolvedValue({ hasPassword: true })
  show()
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Tạo mật khẩu lần đầu' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đổi mật khẩu' })).toBeInTheDocument()
  })
})

it('displays only create password when account has no password', async () => {
  vi.mocked(authService.getAccountSecurity).mockResolvedValue({ hasPassword: false })
  show()
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Tạo mật khẩu lần đầu' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đổi mật khẩu' })).not.toBeInTheDocument()
  })
})
