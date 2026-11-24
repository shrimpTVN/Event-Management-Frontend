import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageProfileEditView } from '../FanpageProfileEditView'
import { fanpageAdminService } from '../../services/fanpageAdminService'
import type { FanpageSummary } from '../../types/fanpageAdmin.types'
import { mediaService } from '@/shared'

vi.mock('../../services/fanpageAdminService', () => ({
  fanpageAdminService: { getFanpageDetail: vi.fn(), updateFanpageProfile: vi.fn() },
}))
vi.mock('@/features/auth', () => ({
  useAuthStore: () => ({ user: { email: 'staff@ctu.edu.vn' } }),
  isStaffUser: () => true,
}))
vi.mock('@/shared', () => ({ mediaService: { uploadImage: vi.fn() } }))

const fanpage = {
  id: '42',
  name: 'Đoàn Khoa CNTT',
  fullName: 'Đoàn Trường CNTT',
  role: 'ADMIN',
  email: 'cntt@ctu.edu.vn',
  phone: '0292 383 0309',
  address: '',
  parentOrg: 'Đoàn trường',
  orgType: 'Đoàn Khoa / Trường',
  description: 'Hoạt động đoàn và sự kiện sinh viên.',
  isVerified: true,
  followersCount: 0,
  eventsCount: 0,
} satisfies FanpageSummary

function show(role = 'ADMIN', overrides: Partial<FanpageSummary> = {}, detail?: FanpageSummary) {
  vi.mocked(fanpageAdminService.getFanpageDetail).mockResolvedValue(
    detail || { ...fanpage, role, ...overrides }
  )
  const onSave = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 300000 } },
  })
  render(
    <QueryClientProvider client={client}>
      <FanpageProfileEditView currentFanpage={{ ...fanpage, role, ...overrides }} onSave={onSave} />
    </QueryClientProvider>
  )
  return { onSave }
}

async function enterEdit() {
  const button = screen.getByRole('button', { name: 'Chỉnh sửa thông tin' })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fanpageAdminService.getFanpageDetail).mockResolvedValue(fanpage)
  vi.mocked(fanpageAdminService.updateFanpageProfile).mockResolvedValue(fanpage)
})

describe('fanpage profile view and edit modes', () => {
  it('fetches complete details despite the app cache time and uses the full organization name', async () => {
    let resolveDetails!: (value: FanpageSummary) => void
    vi.mocked(fanpageAdminService.getFanpageDetail).mockReturnValue(
      new Promise((resolve) => {
        resolveDetails = resolve
      })
    )
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 300000 } },
    })
    render(
      <QueryClientProvider client={client}>
        <FanpageProfileEditView
          currentFanpage={{ ...fanpage, email: '', phone: '', orgType: '', parentOrg: '' }}
        />
      </QueryClientProvider>
    )
    expect(fanpageAdminService.getFanpageDetail).toHaveBeenCalledWith('42')
    expect(screen.getByRole('button', { name: 'Chỉnh sửa thông tin' })).toBeDisabled()
    resolveDetails(fanpage)
    expect(await screen.findByRole('link', { name: fanpage.email })).toBeInTheDocument()
    expect(screen.getByText(fanpage.orgType)).toBeInTheDocument()
    expect(screen.getByText(fanpage.parentOrg)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: fanpage.fullName, level: 2 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: fanpage.name, level: 2 })).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Chỉnh sửa thông tin' })).toBeEnabled()
    )
  })
  it('shows readable details and actionable contact links without form controls', async () => {
    show()
    expect(screen.getByRole('heading', { name: 'Thông tin fanpage', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: fanpage.email })).toHaveAttribute(
      'href',
      'mailto:cntt@ctu.edu.vn'
    )
    expect(screen.getByRole('link', { name: fanpage.phone })).toHaveAttribute(
      'href',
      'tel:02923830309'
    )
    expect(screen.queryByText('Chưa cập nhật')).not.toBeInTheDocument()
    expect(screen.queryByText('Mã viết tắt')).not.toBeInTheDocument()
    expect(screen.queryByText('Địa chỉ')).not.toBeInTheDocument()
    expect(screen.queryByText(/Hỗ trợ định dạng/)).not.toBeInTheDocument()
  })

  it('keeps a member read-only even when the account is staff', async () => {
    show('MEMBER')
    expect(screen.queryByRole('button', { name: 'Chỉnh sửa thông tin' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('preserves the compact profile rows when editing in place', async () => {
    show()
    const profile = screen.getByRole('article', { name: 'Hồ sơ fanpage' })
    const organization = screen.getByText('Đơn vị chủ quản').closest('div')
    const descriptionRow = screen.getByText('Giới thiệu').closest('div')
    const emailRow = screen.getByText('Email hỗ trợ').closest('div')
    expect(screen.queryByText('Thông tin chung')).not.toBeInTheDocument()
    expect(screen.queryByText('Tên đầy đủ của tổ chức')).not.toBeInTheDocument()
    expect(screen.getAllByText(fanpage.fullName)).toHaveLength(1)
    await enterEdit()
    expect(screen.getByRole('article', { name: 'Hồ sơ fanpage' })).toBe(profile)
    expect(screen.getByText('Đơn vị chủ quản').closest('div')).toBe(organization)
    expect(organization).toHaveTextContent(fanpage.parentOrg)
    expect(descriptionRow).toContainElement(screen.getByRole('textbox', { name: 'Giới thiệu' }))
    expect(emailRow).toContainElement(screen.getByRole('textbox', { name: 'Email hỗ trợ' }))
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('article', { name: 'Hồ sơ fanpage' })).toBe(profile)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows a readable organization type below the full name', async () => {
    show('MEMBER', { orgType: 'YOUTH_UNION' })
    expect(screen.getByText('Đoàn / Hội')).toBeInTheDocument()
    expect(screen.queryByText('YOUTH_UNION')).not.toBeInTheDocument()
  })

  it('omits missing data while still allowing supported empty fields to be edited', async () => {
    show('ADMIN', {
      orgType: '',
      fullName: '',
      parentOrg: '',
      description: '',
      email: '',
      phone: '',
      address: 'An unsupported address',
    })
    expect(screen.queryByRole('region', { name: 'Thông tin chung' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Đơn vị chủ quản' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Giới thiệu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Thông tin liên hệ' })).not.toBeInTheDocument()
    expect(screen.queryByText('An unsupported address')).not.toBeInTheDocument()
    await enterEdit()
    expect(screen.getByRole('textbox', { name: 'Giới thiệu' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Email hỗ trợ' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Số điện thoại' })).toHaveValue('')
  })

  it('discards edits and a selected logo when cancelling', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    show()
    await enterEdit()
    fireEvent.change(screen.getByRole('textbox', { name: 'Giới thiệu' }), {
      target: { value: 'Nội dung chưa lưu' },
    })
    const upload = document.querySelector('input[type="file"]')!
    fireEvent.change(upload, {
      target: { files: [new File(['logo'], 'logo.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('heading', { name: fanpage.fullName })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await enterEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(fanpageAdminService.updateFanpageProfile).toHaveBeenCalled())
    expect(mediaService.uploadImage).not.toHaveBeenCalled()
  })

  it('sends edited fields through the existing update service', async () => {
    const { onSave } = show()
    await enterEdit()
    expect(screen.queryByLabelText(/Tên hiển thị fanpage/)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Giới thiệu' }), {
      target: { value: 'Giới thiệu mới' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Giới thiệu mới' })
      )
    )
    expect(fanpageAdminService.updateFanpageProfile).toHaveBeenCalledWith('42', {
      description: 'Giới thiệu mới',
      email: fanpage.email,
      phone: fanpage.phone,
      avatarUrl: '',
    })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('uploads the logo and sends its real URL to the update API', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    vi.mocked(mediaService.uploadImage).mockResolvedValue('https://cdn.example.com/logo.png')
    const { onSave } = show()
    await enterEdit()
    const file = new File(['logo'], 'logo.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn logo fanpage'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: 'https://cdn.example.com/logo.png' })
      )
    )
    expect(mediaService.uploadImage).toHaveBeenCalledWith(file, 'FANPAGE')
    expect(fanpageAdminService.updateFanpageProfile).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({ avatarUrl: 'https://cdn.example.com/logo.png' })
    )
  })

  it('keeps the draft and reports an update error without claiming success', async () => {
    vi.mocked(fanpageAdminService.updateFanpageProfile).mockRejectedValue(new Error('Forbidden'))
    const { onSave } = show()
    await enterEdit()
    fireEvent.change(screen.getByRole('textbox', { name: 'Giới thiệu' }), {
      target: { value: 'Nội dung chưa lưu' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa lưu được thay đổi')
    expect(screen.getByRole('textbox', { name: 'Giới thiệu' })).toHaveValue('Nội dung chưa lưu')
    expect(onSave).not.toHaveBeenCalled()
  })
})
