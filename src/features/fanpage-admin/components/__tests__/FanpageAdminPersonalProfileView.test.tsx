import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FanpageAdminPersonalProfileView } from '../FanpageAdminPersonalProfileView'
import { profileService, type StudentProfile } from '@/features/profile'
import { fanpageAdminService } from '../../services/fanpageAdminService'
import { useAuthStore } from '@/features/auth/store/authStore'
import { RoleEnum } from '@/features/auth/types/auth.types'

vi.mock('@/features/profile', () => ({
  profileService: { getMyProfile: vi.fn(), updateMyProfile: vi.fn(), getMyStaffProfile: vi.fn(), updateMyStaffProfile: vi.fn() },
}))
vi.mock('../../services/fanpageAdminService', () => ({
  fanpageAdminService: { getAvailableFanpages: vi.fn() },
}))

const profile: StudentProfile = {
  id: 'student-1',
  fullName: 'Đoàn Tài Lộc',
  email: 'loc@student.ctu.edu.vn',
  studentId: 'B2303827',
  gender: 'Nam',
  cohort: 'K49',
  faculty: 'Trường CTU',
  major: 'Kỹ thuật phần mềm',
  majorCode: 'KTPM',
  youthUnionBranch: 'Chi hội CTU',
  avatarUrl: 'https://cdn.example.com/avatar.png',
  status: 'Đang học',
  classId: '',
  dateOfBirth: '',
  bio: '',
  phoneNumber: '',
  academicProgram: '',
  roles: ['STUDENT'],
}
function show(staff = false) {
  useAuthStore
    .getState()
    .setAuth(
      {
        id: staff ? 'staff-1' : 'student-1',
        name: staff ? 'Tên cán bộ thật' : profile.fullName,
        email: staff ? 'staff@ctu.edu.vn' : profile.email,
        role: staff ? RoleEnum.FANPAGE_ADMIN : RoleEnum.STUDENT,
        createdAt: '2026-01-01',
      },
      'test-token'
    )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FanpageAdminPersonalProfileView />
      </MemoryRouter>
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.getState().clearAuth()
  vi.mocked(profileService.getMyProfile).mockResolvedValue(profile)
  vi.mocked(fanpageAdminService.getAvailableFanpages).mockResolvedValue([])
})

describe('personal profile in the fanpage workspace', () => {
  it('shows real account information without fabricated staff details when no staff profile API is available', async () => {
    vi.mocked(profileService.getMyStaffProfile).mockRejectedValue({ response: { status: 404 } })
    show(true)
    expect(screen.getByRole('heading', { name: 'Tên cán bộ thật' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'staff@ctu.edu.vn' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Đang tải hồ sơ...')).not.toBeInTheDocument())
    expect(screen.getByText('Quản trị viên fanpage')).toBeInTheDocument()
    expect(screen.queryByText('CB-0104')).not.toBeInTheDocument()
    expect(screen.queryByText('Bí thư Đoàn khoa')).not.toBeInTheDocument()
    expect(screen.queryByText('15/10/1995')).not.toBeInTheDocument()
    expect(screen.queryByText('02923872254')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chỉnh sửa thông tin' })).not.toBeInTheDocument()
  })
  it('edits supported fields in place and discards a cancelled name change', async () => {
    show()
    const button = await screen.findByRole('button', { name: 'Chỉnh sửa thông tin' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    fireEvent.change(screen.getByRole('textbox', { name: 'Họ và tên' }), {
      target: { value: 'Tên chưa lưu' },
    })
    expect(screen.queryByRole('textbox', { name: 'Ngày sinh' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Số điện thoại' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('heading', { name: profile.fullName })).toBeInTheDocument()
    expect(profileService.updateMyProfile).not.toHaveBeenCalled()
  })
  it('keeps failed edits and never displays a success message on an API error', async () => {
    vi.mocked(profileService.updateMyProfile).mockRejectedValue(new Error('Không thể lưu'))
    show()
    const button = await screen.findByRole('button', { name: 'Chỉnh sửa thông tin' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    fireEvent.change(screen.getByRole('textbox', { name: 'Họ và tên' }), {
      target: { value: 'Nguyễn Minh Anh' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu')
    expect(screen.getByRole('textbox', { name: 'Họ và tên' })).toHaveValue('Nguyễn Minh Anh')
    expect(screen.queryByText('Đã lưu thông tin cá nhân.')).not.toBeInTheDocument()
    expect(useAuthStore.getState().user?.name).toBe(profile.fullName)
  })
  it('lists the API fanpages using the real membership roles and full names', async () => {
    vi.mocked(fanpageAdminService.getAvailableFanpages).mockResolvedValue([
      { id: '7', name: 'Tên trang', fullName: 'Tên đơn vị thật', role: 'MEMBER' } as any,
    ])
    show()
    expect(await screen.findByRole('link', { name: /Tên đơn vị thật/ })).toHaveAttribute(
      'href',
      '/fanpage/workspace'
    )
    expect(screen.getByText('Cộng tác viên')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fanpage bạn tham gia' })).toBeInTheDocument()
  })
})
