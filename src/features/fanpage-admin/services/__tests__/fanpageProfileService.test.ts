import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { put: vi.fn(), get: vi.fn() } }))
import { apiClient } from '@/shared'
import { fanpageAdminService } from '../fanpageAdminService'

beforeEach(() => vi.clearAllMocks())

describe('fanpage profile update contract', () => {
  it('does not invent profile fields missing from the detail response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ id: 1, name: 'Đoàn Khoa CNTT' })
    const profile = await fanpageAdminService.getFanpageDetail('1')
    expect(profile).not.toHaveProperty('code')
    expect(profile).not.toHaveProperty('avatarText')
    expect(profile).toMatchObject({
      address: '',
      fullName: '',
      parentOrg: '',
      orgType: '',
      avatarUrl: '',
    })
  })

  it('sends only the four fields accepted by FanpageAdminUpdateRequestDto', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({})
    await fanpageAdminService.updateFanpageProfile('42', {
      name: 'Unsupported name',
      fullName: 'Unsupported org',
      address: 'Unsupported address',
      parentOrg: 'Unsupported parent',
      orgType: 'Unsupported type',
      description: 'Giới thiệu mới',
      avatarUrl: 'https://cdn.example.com/logo.png',
      email: 'contact@ctu.edu.vn',
      phone: '02923830309',
    })
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith('/fanpages/fanpage-admin/42', {
      description: 'Giới thiệu mới',
      avatarUrl: 'https://cdn.example.com/logo.png',
      helpContact: 'contact@ctu.edu.vn',
      helpPhone: '02923830309',
    })
  })
})
