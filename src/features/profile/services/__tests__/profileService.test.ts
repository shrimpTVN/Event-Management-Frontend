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
  it('requires an explicit major ID instead of matching names or using ID 1', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ ...dto, majorId: undefined })
    await expect(profileService.updateMyProfile({ fullName: 'Nguyễn Minh Anh' })).rejects.toThrow(
      'Vui lòng chọn khoa/trường'
    )
    expect(apiClient.put).not.toHaveBeenCalled()
    expect(apiClient.get).toHaveBeenCalledTimes(1)
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
  it('validates the selected school-major relation and saves a changed major by ID', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) =>
      url === '/schools/8'
        ? {
            id: 8,
            isActive: true,
            majors: [{ id: 81, name: 'Ngành mới', code: 'NEW', isActive: true }],
          }
        : { ...dto, schoolId: 7 }
    )
    vi.mocked(apiClient.put).mockResolvedValue({ ...dto, majorId: 81, schoolId: 8 })
    const result = await profileService.updateMyProfile({ schoolId: 8, majorId: 81 })
    expect(apiClient.put).toHaveBeenCalledWith(
      '/users/me/profile',
      expect.objectContaining({ majorId: 81 })
    )
    expect(result).toMatchObject({ majorId: 81, schoolId: 8 })
  })
  it('does not keep the previous major after the school changes without a new major selection', async () => {
    await expect(
      profileService.updateMyProfile({ schoolId: 8, majorId: undefined })
    ).rejects.toThrow('Vui lòng chọn')
    expect(apiClient.put).not.toHaveBeenCalled()
  })
})
