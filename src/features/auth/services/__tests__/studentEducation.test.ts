import { beforeEach, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { authService } from '../authService'
import { educationCatalogService } from '@/shared/services/educationCatalogService'

vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), put: vi.fn() } }))
const payload = {
  fullName: 'Nguyễn Văn A',
  studentId: 'B2300001',
  email: 'a@student.ctu.edu.vn',
  gender: 'MALE' as const,
  faculty: '7',
  major: '71',
  schoolId: 7,
  majorId: 71,
  className: 'DI23',
  academicYear: 'Khóa 49',
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(apiClient.get).mockResolvedValue({
    id: 7,
    isActive: true,
    majors: [{ id: 71, name: 'Ngành A', code: 'A', isActive: true }],
  })
  vi.mocked(apiClient.put).mockResolvedValue({
    email: payload.email,
    majorId: 71,
    schoolId: 7,
    firstName: 'Văn A',
    lastName: 'Nguyễn',
    role: 'STUDENT',
  })
})
it('saves the actual selected major ID without assigning an association or a default major', async () => {
  await authService.completeStudentProfile(payload)
  expect(apiClient.get).toHaveBeenCalledWith('/schools/7')
  expect(apiClient.put).toHaveBeenCalledWith(
    '/users/me/profile',
    expect.objectContaining({ majorId: 71, kNumber: 49 })
  )
  expect(vi.mocked(apiClient.put).mock.calls[0][1]).not.toHaveProperty('associationId')
})
it('rejects a major outside the selected school or a deactivated major', async () => {
  await expect(educationCatalogService.validateSelection(7, 81)).rejects.toThrow('không thuộc')
  vi.mocked(apiClient.get).mockResolvedValue({
    id: 7,
    isActive: true,
    majors: [{ id: 71, isActive: false }],
  })
  await expect(authService.completeStudentProfile(payload)).rejects.toThrow('không còn hoạt động')
  expect(apiClient.put).not.toHaveBeenCalled()
})
it('propagates save failures instead of marking an unsaved profile complete', async () => {
  vi.mocked(apiClient.put).mockRejectedValue(new Error('save failed'))
  await expect(authService.completeStudentProfile(payload)).rejects.toThrow('save failed')
})
