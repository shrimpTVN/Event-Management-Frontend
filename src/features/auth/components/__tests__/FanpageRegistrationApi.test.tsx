import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FanpageRegistrationForm } from '../FanpageRegistrationForm'
import { apiClient } from '@/shared'
import { mediaService } from '@/shared/services/mediaService'
import { authService } from '../../services/authService'
vi.mock('@/shared', () => ({ apiClient: { post: vi.fn(), get: vi.fn() } }))
vi.mock('@/shared/services/mediaService', () => ({ mediaService: { uploadImage: vi.fn() } }))
vi.mock('../../services/authService', () => ({
  authService: {
    getFanpageRegistrationEligibility: vi.fn(),
  },
}))
beforeEach(() => {
  vi.resetAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:logo')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(mediaService.uploadImage).mockImplementation(async (_file, category) => category === 'FANPAGE' ? 'https://cdn/logo.png' : 'https://cdn/proof.pdf')
  vi.mocked(authService.getFanpageRegistrationEligibility).mockResolvedValue({ status: 'ELIGIBLE' })
})
function fill() {
  render(<MemoryRouter><FanpageRegistrationForm /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText(/Tên fanpage/), { target: { value: 'CLB CTU' } })
  fireEvent.change(screen.getByLabelText('Logo fanpage'), { target: { files: [new File(['logo'], 'logo.png', { type: 'image/png' })] } })
  fireEvent.change(screen.getByLabelText('Minh chứng thành lập'), { target: { files: [new File(['proof'], 'proof.pdf', { type: 'application/pdf' })] } })
}
it('uploads actual logo and a single proof, retaining uploaded URLs for a failed registration retry', async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce({ response: { data: { message: 'Chưa đăng ký được.' } } }).mockResolvedValueOnce(undefined)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' }))
  expect(await screen.findByText('Chưa đăng ký được.')).toBeInTheDocument()
  expect(apiClient.post).toHaveBeenCalledWith('/fanpages/fanpage-admin/register', expect.objectContaining({ name: 'CLB CTU', avatarUrl: 'https://cdn/logo.png', evidenceUrl: 'https://cdn/proof.pdf' }))
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' }))
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2))
  expect(mediaService.uploadImage).toHaveBeenCalledTimes(2)
  expect(screen.queryByRole('button', { name: 'Gửi yêu cầu đăng ký' })).not.toBeInTheDocument()
})
it('does not register when evidence upload fails', async () => {
  vi.mocked(mediaService.uploadImage).mockResolvedValueOnce('https://cdn/logo.png').mockRejectedValueOnce(new Error('Tải minh chứng thất bại.'))
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu đăng ký' }))
  expect(await screen.findByText('Tải minh chứng thất bại.')).toBeInTheDocument()
  expect(apiClient.post).not.toHaveBeenCalled()
  expect(screen.getByText('proof.pdf')).toBeInTheDocument()
})

it('prompts staff profile when registration eligibility is PROFILE_REQUIRED', async () => {
  vi.mocked(authService.getFanpageRegistrationEligibility).mockResolvedValueOnce({
    status: 'PROFILE_REQUIRED',
    reasonCode: 'FANPAGE_ADMIN_PROFILE_REQUIRED',
    requiresReauthentication: false,
  })
  render(
    <MemoryRouter>
      <FanpageRegistrationForm />
    </MemoryRouter>
  )
  expect(
    await screen.findByText('Yêu cầu thông tin Cán bộ / Ban tổ chức')
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Bạn cần cập nhật hồ sơ Cán bộ \/ Đơn vị/)
  ).toBeInTheDocument()
})
