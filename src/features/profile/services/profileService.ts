import { apiClient } from '@/shared'
import type { StudentProfile } from '../types/profile.types'

export function mapBackendProfileToStudentProfile(dto: any): StudentProfile {
  if (!dto) return dto
  const firstName = dto.firstName || ''
  const lastName = dto.lastName || ''
  const fullName = `${lastName} ${firstName}`.trim() || dto.fullName || ''

  let genderDisplay: StudentProfile['gender'] = ''
  if (dto.gender === 'MALE' || dto.gender === 'Nam') genderDisplay = 'Nam'
  if (dto.gender === 'FEMALE' || dto.gender === 'Nữ') {
    genderDisplay = 'Nữ'
  } else if (dto.gender === 'OTHER' || dto.gender === 'Khác') {
    genderDisplay = 'Khác'
  }

  const kNum = dto.kNumber ? String(dto.kNumber) : ''
  const cohort = kNum ? `K${kNum}` : dto.cohort || ''

  return {
    id: String(dto.id || dto.studentId || ''),
    fullName,
    firstName,
    lastName,
    majorId: dto.majorId ?? undefined,
    associationId: dto.associationId ?? undefined,
    roles: dto.roles || (dto.role ? [dto.role] : undefined),
    staffId: dto.staffId || '',
    orgName: dto.orgName || '',
    title: dto.title || '',
    status: dto.isActive !== false ? 'Đang học' : 'Tạm nghỉ',
    studentId: dto.studentId || '',
    classId: dto.classId || '',
    cohort,
    dateOfBirth: dto.dateOfBirth || dto.dob || '',
    gender: genderDisplay,
    bio: dto.bio || '',
    phoneNumber: dto.phoneNumber || '',
    email: dto.email || '',
    faculty: dto.schoolName || dto.faculty || '',
    major: dto.majorName || dto.major || '',
    majorCode: dto.majorCode || '',
    academicProgram: dto.academicProgram || '',
    youthUnionBranch: dto.associationName || dto.youthUnionBranch || '',
    avatarUrl: dto.avatarUrl || '',
  }
}

export const profileService = {
  async getMyStaffProfile(): Promise<StudentProfile> {
    const dto: any = await apiClient.get('/users/me/staff-profile')
    return mapBackendProfileToStudentProfile({ ...dto, ...dto.staffProfile, id: dto.userId })
  },

  async updateMyStaffProfile(
    payload: Partial<StudentProfile>,
    current: StudentProfile
  ): Promise<StudentProfile> {
    const patch: Record<string, unknown> = {}
    if (payload.fullName !== undefined && payload.fullName.trim() !== current.fullName) {
      const parts = payload.fullName.trim().split(/\s+/)
      if (parts.length < 2) throw new Error('Vui lòng nhập đầy đủ họ và tên.')
      patch.lastName = parts.slice(0, -1).join(' ')
      patch.firstName = parts.at(-1)
    }
    if (payload.gender !== undefined && payload.gender !== current.gender) {
      const gender = { Nam: 'MALE', Nữ: 'FEMALE', Khác: 'OTHER', '': null }[payload.gender]
      patch.gender = gender
    }
    const details: Record<string, unknown> = {}
    for (const key of ['title', 'phoneNumber', 'dateOfBirth'] as const) {
      if (payload[key] !== undefined && payload[key] !== current[key])
        details[key] = payload[key]?.trim() || null
    }
    if (Object.keys(details).length) patch.staffProfile = details
    if (Object.keys(patch).length) await apiClient.patch('/users/me/staff-profile', patch)
    if (payload.avatarUrl !== undefined && payload.avatarUrl !== current.avatarUrl) {
      await apiClient.patch('/users/me/profile/change-avatar', { avatarUrl: payload.avatarUrl })
    }
    return profileService.getMyStaffProfile()
  },
  /**
   * Fetches current authenticated student profile
   */
  async getMyProfile(): Promise<StudentProfile> {
    const res: any = await apiClient.get('/users/me/profile')
    return mapBackendProfileToStudentProfile(res?.data || res)
  },

  /**
   * Updates student profile information including Cloudinary avatarUrl
   */
  async updateMyProfile(payload: Partial<StudentProfile>): Promise<StudentProfile> {
    const current = await profileService.getMyProfile()
    const fullName = (payload.fullName ?? current.fullName).trim()
    const parts = fullName.split(/\s+/)
    if (parts.length < 2) throw new Error('Vui lòng nhập đầy đủ họ và tên.')
    const unchangedName = fullName === current.fullName && current.firstName && current.lastName
    const lastName = unchangedName ? current.lastName : parts[0]
    const firstName = unchangedName ? current.firstName : parts.slice(1).join(' ')
    const genderLabels: Record<string, string> = { Nam: 'MALE', Nữ: 'FEMALE', Khác: 'OTHER' }
    const gender = genderLabels[payload.gender ?? current.gender]
    const kNumber = Number((current.cohort || '').replace(/^K/i, ''))
    const avatarUrl = payload.avatarUrl ?? current.avatarUrl
    if (!gender || !Number.isInteger(kNumber) || kNumber < 1 || kNumber > 100 || !avatarUrl) {
      throw new Error(
        'Hồ sơ thiếu giới tính, khóa học hoặc ảnh đại diện. Vui lòng hoàn thiện trước khi lưu.'
      )
    }
    let majorId = current.majorId
    let associationId = current.associationId
    const lookupRequests: Promise<void>[] = []
    if (!majorId)
      lookupRequests.push(
        (async () => {
          const result: any = await apiClient.get('/majors')
          const items = result?.data || result
          if (!Array.isArray(items)) throw new Error('Không tải được danh sách ngành học.')
          const matches = items.filter((item) =>
            current.majorCode
              ? item.code === current.majorCode
              : current.major && item.name === current.major
          )
          if (matches.length === 1) majorId = Number(matches[0].id)
        })()
      )
    if (!associationId)
      lookupRequests.push(
        (async () => {
          const result: any = await apiClient.get('/associations')
          const items = result?.data || result
          if (!Array.isArray(items)) throw new Error('Không tải được danh sách chi hội.')
          const matches = items.filter(
            (item) => current.youthUnionBranch && item.name === current.youthUnionBranch
          )
          if (matches.length === 1) associationId = Number(matches[0].id)
        })()
      )
    await Promise.all(lookupRequests)
    if (
      !Number.isSafeInteger(majorId) ||
      !majorId ||
      majorId < 1 ||
      !Number.isSafeInteger(associationId) ||
      !associationId ||
      associationId < 1
    ) {
      throw new Error('Chưa xác định được ngành học hoặc chi hội hiện tại. Không thể lưu hồ sơ.')
    }
    const res: any = await apiClient.put('/users/me/profile', {
      firstName,
      lastName,
      gender,
      kNumber,
      avatarUrl,
      associationId,
      majorId,
    })
    const dto = res?.data || res
    if (!dto || typeof dto !== 'object' || !dto.email)
      throw new Error('Máy chủ chưa trả về hồ sơ đã cập nhật.')
    return mapBackendProfileToStudentProfile(dto)
  },

  /**
   * Directly updates avatar URL on student profile (Cloudinary image URL)
   */
  async updateAvatar(avatarUrl: string): Promise<StudentProfile> {
    await apiClient.patch('/users/me/profile/change-avatar', { avatarUrl })
    return profileService.getMyProfile()
  },
}
