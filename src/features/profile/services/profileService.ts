import { apiClient } from '@/shared'
import type { StudentProfile } from '../types/profile.types'

export function mapBackendProfileToStudentProfile(dto: any): StudentProfile {
  if (!dto) return dto
  const firstName = dto.firstName || ''
  const lastName = dto.lastName || ''
  const fullName = `${lastName} ${firstName}`.trim() || dto.fullName || ''

  let genderDisplay: 'Nam' | 'Nữ' | 'Khác' = 'Nam'
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
    status: dto.isActive !== false ? 'Đang học' : 'Tạm nghỉ',
    studentId: dto.studentId || '',
    classId: dto.classId || '',
    cohort,
    dateOfBirth: dto.dateOfBirth || '',
    gender: genderDisplay,
    bio: dto.bio || '',
    phoneNumber: dto.phoneNumber || '',
    email: dto.email || '',
    faculty: dto.schoolName || dto.faculty || '',
    major: dto.majorName || dto.major || '',
    majorCode: dto.majorCode || '',
    academicProgram: dto.academicProgram || 'Đại trà (Chương trình chuẩn)',
    youthUnionBranch: dto.associationName || dto.youthUnionBranch || '',
    avatarUrl: dto.avatarUrl || '',
  }
}

export const profileService = {
  /**
   * Fetches current authenticated student profile
   */
  async getMyProfile(): Promise<StudentProfile> {
    const res: any = await apiClient.get('/users/me/profile')
    return mapBackendProfileToStudentProfile(res)
  },

  /**
   * Updates student profile information including Cloudinary avatarUrl
   */
  async updateMyProfile(payload: Partial<StudentProfile>): Promise<StudentProfile> {
    const fullName = (payload.fullName || '').trim()
    const parts = fullName.split(/\s+/)
    const lastName = parts.length > 1 ? parts[0] : (parts[0] || 'Đoàn')
    const firstName = parts.length > 1 ? parts.slice(1).join(' ') : (parts[0] || 'Tài Lộc')

    let genderEnum = 'MALE'
    const rawGender = String(payload.gender || '')
    if (rawGender === 'Nữ' || rawGender === 'FEMALE') {
      genderEnum = 'FEMALE'
    } else if (rawGender === 'Khác' || rawGender === 'OTHER') {
      genderEnum = 'OTHER'
    }

    const kNum = payload.cohort ? parseInt(payload.cohort.replace(/\D/g, ''), 10) : 49

    const body = {
      firstName,
      lastName,
      gender: genderEnum,
      kNumber: isNaN(kNum) ? 49 : kNum,
      avatarUrl: payload.avatarUrl || '',
      associationId: 1,
      majorId: 1,
    }

    try {
      const res: any = await apiClient.put('/users/me/profile', body)
      const mapped = mapBackendProfileToStudentProfile(res)
      return {
        ...mapped,
        avatarUrl: payload.avatarUrl || mapped.avatarUrl,
        phoneNumber: payload.phoneNumber || mapped.phoneNumber || '',
        classId: payload.classId || mapped.classId || '',
      }
    } catch {
      return payload as StudentProfile
    }
  },

  /**
   * Directly updates avatar URL on student profile (Cloudinary image URL)
   */
  async updateAvatar(avatarUrl: string): Promise<StudentProfile> {
    const res: any = await apiClient.patch('/users/me/profile/change-avatar', { avatarUrl })
    return mapBackendProfileToStudentProfile(res)
  },
}
