import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), put: vi.fn(), patch: vi.fn() } }))
import { apiClient } from '@/shared'
import { mapBackendProfileToStudentProfile, profileService } from '../profileService'

const dto = {
  email: 'loc@student.ctu.edu.vn',
  firstName: 'Lộc',
  lastName: 'Đoàn Tài',
  studentId: 'B2303827',
  gender: 'MALE',
  kNumber: '49',
  avatarUrl: 'https://cdn.example.com/avatar.png',
  majorId: 12,
  associationId: 34,
  majorCode: 'KTPM',
  majorName: 'Kỹ thuật phần mềm',
  associationName: 'Chi hội CTU',
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(apiClient.get).mockResolvedValue(dto)
  vi.mocked(apiClient.put).mockResolvedValue(dto)
})

describe('real personal profile data', () => {
  it('does not fabricate names, gender, academic programs or staff information', () => {
    expect(mapBackendProfileToStudentProfile({ email: 'staff@ctu.edu.vn' })).toMatchObject({
      fullName: '',
      gender: '',
      academicProgram: '',
      staffId: '',
      title: '',
      orgName: '',
      dateOfBirth: '',
      phoneNumber: '',
      studentId: '',
      faculty: '',
    })
  })
  it('maps staff fields independently from student identifiers and faculties', () => {
    expect(
      mapBackendProfileToStudentProfile({
        staffId: 'CB-55',
        title: 'Giảng viên',
        orgName: 'Trường CTU',
        studentId: 'B2300000',
        schoolName: 'Khoa A',
      })
    ).toMatchObject({
      staffId: 'CB-55',
      title: 'Giảng viên',
      orgName: 'Trường CTU',
      studentId: 'B2300000',
      faculty: 'Khoa A',
    })
  })
  it('preserves actual academic identifiers and existing name parts when updating', async () => {
    await profileService.updateMyProfile({ fullName: 'Đoàn Tài Lộc', gender: 'Nữ' })
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith('/users/me/profile', {
      firstName: 'Lộc',
      lastName: 'Đoàn Tài',
      gender: 'FEMALE',
      kNumber: 49,
      avatarUrl: dto.avatarUrl,
      majorId: 12,
      associationId: 34,
    })
  })
  it('resolves missing identifiers from real catalogs rather than assigning ID 1', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/users/me/profile')
        return { ...dto, majorId: undefined, associationId: undefined }
      if (url === '/majors') return [{ id: 12, name: dto.majorName, code: dto.majorCode }]
      if (url === '/associations') return [{ id: 34, name: dto.associationName }]
      throw new Error('Unexpected URL')
    })
    await profileService.updateMyProfile({ fullName: 'Nguyễn Minh Anh', gender: 'Nữ' })
    expect(apiClient.put).toHaveBeenCalledWith(
      '/users/me/profile',
      expect.objectContaining({ majorId: 12, associationId: 34 })
    )
  })
  it('does not write a profile when existing academic identifiers cannot be resolved', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) =>
      url === '/users/me/profile' ? { ...dto, majorId: undefined, associationId: undefined } : []
    )
    await expect(profileService.updateMyProfile({ fullName: 'Nguyễn Minh Anh' })).rejects.toThrow(
      'Chưa xác định'
    )
    expect(apiClient.put).not.toHaveBeenCalled()
  })
  it('propagates update failures instead of returning unsaved input as a successful profile', async () => {
    vi.mocked(apiClient.put).mockRejectedValue(new Error('API failure'))
    await expect(profileService.updateMyProfile({ fullName: 'Nguyễn Minh Anh' })).rejects.toThrow(
      'API failure'
    )
  })
})
