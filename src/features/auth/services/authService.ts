import { apiClient } from '@/shared'
import {
  type User,
  type AuthTokens,
  type AuthResponse,
  type LoginPayload,
  type RegisterPayload,
  type StudentProfilePayload,
  type StaffProfilePayload,
  type GoogleAuthPayload,
  RoleEnum,
} from '../types/auth.types'
import { normalizeRole } from '../utils/authUtils'
import { normalizeOrgName } from '../utils/staffProfileUtils'
import { addRegisteredEmail } from './accountVerificationService'

async function formatAuthUser(response: any, fallbackEmail: string): Promise<AuthResponse> {
  const data = response?.data || response
  const rawRole = data?.role || data?.roles?.[0] || data?.user?.role || RoleEnum.STUDENT
  const normalizedRole = normalizeRole(rawRole) || RoleEnum.STUDENT
  const emailUsername = (data?.email || fallbackEmail).split('@')[0] || ''
  const rolesArray = data?.roles || (data?.role ? [data.role] : [rawRole])

  const emailMatch = (data?.email || fallbackEmail).match(/([a-zA-Z]\d{7})/i)
  const fallbackStudentId = emailMatch ? emailMatch[1].toUpperCase() : undefined

  const user: User = data?.user
    ? {
        ...data.user,
        role: normalizeRole(data.user.role) || normalizedRole,
        roles: data.roles || data.user.roles || rolesArray,
      }
    : {
        id: String(data?.userId || 'usr-1'),
        email: data?.email || fallbackEmail,
        name:
          data?.name ||
          emailUsername
            .replace(/[0-9]/g, '')
            .replace(/[._]/g, ' ')
            .trim() ||
          emailUsername ||
          'Người dùng CTU',
        studentId: normalizedRole === RoleEnum.STUDENT ? (data?.studentId || fallbackStudentId) : undefined,
        role: normalizedRole,
        roles: rolesArray,
        createdAt: data?.createdAt || new Date().toISOString(),
        isProfileComplete: Boolean(data?.isProfileComplete || data?.user?.isProfileComplete),
      }

  try {
    const profileRes: any = await apiClient.get('/users/me/profile')
    const pData = profileRes?.data || profileRes
    if (pData) {
      if (pData.studentId) user.studentId = pData.studentId
      const realName = `${pData.lastName || ''} ${pData.firstName || ''}`.trim()
      if (realName) user.name = realName
      if (pData.avatarUrl) user.avatarUrl = pData.avatarUrl
      user.isProfileComplete = true
    }
  } catch {
    if (normalizedRole === RoleEnum.STUDENT) {
      user.isProfileComplete = false
    }
  }

  const tokens: AuthTokens = data?.tokens || {
    accessToken: data?.accessToken || undefined,
  }

  return {
    ...data,
    user,
    tokens,
  }
}

export const authService = {
  /**
   * Authenticate user with CTU email and password
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response: any = await apiClient.post('/auth/login', payload)
    return formatAuthUser(response, payload.email)
  },

  /**
   * Register new account with university email and password
   */
  async register(payload: RegisterPayload): Promise<{ success: boolean; email: string }> {
    await apiClient.post('/auth/register', {
      email: payload.email,
      password: payload.password,
      otpCode: payload.otpCode,
      firstName: payload.firstName,
      lastName: payload.lastName,
    })
    addRegisteredEmail(payload.email)
    return { success: true, email: payload.email }
  },

  /**
   * Request OTP verification code sent to CTU email
   */
  async sendOtp(email: string): Promise<boolean> {
    await apiClient.post('/auth/send-otp', { email })
    return true
  },

  /**
   * Verify OTP code entered by student/staff
   */
  async verifyOtp(payload: { email: string; otp: string }): Promise<boolean> {
    const rawOtp = String(payload.otp || '').trim()
    const otpCode = rawOtp.length === 6 ? rawOtp : rawOtp.padStart(6, '0')
    const res: any = await apiClient.post('/auth/verify-otp', {
      email: payload.email,
      otpCode,
    })
    return res === true || res?.success === true || (res && typeof res === 'object')
  },

  /**
   * Resend OTP code to email
   */
  async resendOtp(email: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/send-otp', { email })
    } catch {
      await apiClient.post('/auth/resend-otp', { email })
    }
    return true
  },

  /**
   * Complete student profile on first login/registration
   */
  async completeStudentProfile(payload: StudentProfilePayload): Promise<User> {
    const parts = (payload.fullName || '').trim().split(/\s+/)
    const lastName = parts.length > 1 ? parts[0] : 'Sinh viên'
    const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU'

    const kMatch = (payload.academicYear || '').match(/\d+/)
    const kNumber = kMatch ? parseInt(kMatch[0], 10) : 49

    const profileDto = {
      firstName,
      lastName,
      gender: payload.gender || 'MALE',
      kNumber,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.studentId || payload.email)}`,
      associationId: 1,
      majorId: 1,
    }

    try {
      const response: any = await apiClient.put('/users/me/profile', profileDto)
      const data = response?.data || response
      const updatedUser: User = {
        id: String(data?.userId || 'usr-1'),
        email: data?.email || payload.email,
        name: `${data?.lastName || lastName} ${data?.firstName || firstName}`.trim() || payload.fullName,
        studentId: data?.studentId || payload.studentId,
        avatarUrl: data?.avatarUrl || profileDto.avatarUrl,
        role: normalizeRole(data?.role) || RoleEnum.STUDENT,
        roles: data?.roles || [data?.role || RoleEnum.STUDENT],
        createdAt: new Date().toISOString(),
        isProfileComplete: true,
      }
      return updatedUser
    } catch {
      return {
        id: 'usr-1',
        email: payload.email,
        name: payload.fullName,
        studentId: payload.studentId,
        role: RoleEnum.STUDENT,
        createdAt: new Date().toISOString(),
        isProfileComplete: true,
      }
    }
  },

  /**
   * Complete staff profile on first login/registration
   */
  async completeStaffProfile(payload: StaffProfilePayload): Promise<User> {
    const pendingRaw = sessionStorage.getItem('pending_registration')
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null

    if (pending?.password) {
      const parts = (payload.fullName || '').trim().split(' ')
      const lastName = parts.length > 1 ? parts[0] : 'Cán bộ'
      const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU'

      const registerDto = {
        email: pending.email,
        password: pending.password,
        providerId: 'LOCAL',
        firstName,
        lastName,
        staffId: (payload.staffId || 'CB02934').substring(0, 20).trim(),
        orgName: normalizeOrgName(payload.department),
        title: (payload.position || 'Cán bộ').substring(0, 100).trim(),
        DoB: '1995-01-01T00:00:00Z',
        gender: 'MALE',
        phoneNumber: (payload.phoneNumber || '02923872254').substring(0, 20).trim(),
      }

      await apiClient.post('/auth/register/fanpage-admin', registerDto)
      addRegisteredEmail(pending.email)
      sessionStorage.removeItem('pending_registration')
      const loginRes = await this.login({
        email: pending.email,
        password: pending.password,
      })

      const user: User = {
        ...loginRes.user,
        name: payload.fullName || loginRes.user.name,
        isProfileComplete: true,
      }
      return user
    }

    return apiClient.post('/auth/staff-profile', payload)
  },

  /**
   * Exchanges Google OAuth credential token with backend
   */
  async exchangeGoogleToken(payload: GoogleAuthPayload | { idToken: string }): Promise<AuthResponse> {
    const idToken = 'idToken' in payload ? payload.idToken : payload.credential
    const response: any = await apiClient.post('/auth/login/google', { idToken })
    return formatAuthUser(response, 'student.google@ctu.edu.vn')
  },

  /**
   * Retrieves current authenticated user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get('/auth/me')
  },

  /**
   * Logs out user and invalidates session token on backend
   */
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout')
  },
}
