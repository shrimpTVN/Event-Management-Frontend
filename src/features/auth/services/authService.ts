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

export const authService = {
  /**
   * Authenticate user with CTU email and password
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response: any = await apiClient.post('/auth/login', payload)

    // Adapt both canonical Spring Boot flat response ({ userId, email, roles, role })
    // and nested mock server response ({ user, tokens })
    const rawRole = response?.role || response?.roles?.[0] || response?.user?.role || RoleEnum.STUDENT
    const normalizedRole = normalizeRole(rawRole) || RoleEnum.STUDENT
    const emailUsername = (response?.email || payload.email).split('@')[0] || ''
    const rolesArray = response?.roles || (response?.role ? [response.role] : [rawRole])

    // Extract student ID matching standard CTU format e.g. B2303827 from email
    const emailMatch = (response?.email || payload.email).match(/([a-zA-Z]\d{7})/i)
    const fallbackStudentId = emailMatch ? emailMatch[1].toUpperCase() : undefined

    const user: User = response?.user
      ? {
          ...response.user,
          role: normalizeRole(response.user.role) || normalizedRole,
          roles: response.roles || response.user.roles || rolesArray,
        }
      : {
          id: String(response?.userId || 'usr-1'),
          email: response?.email || payload.email,
          name:
            response?.name ||
            emailUsername
              .replace(/[0-9]/g, '')
              .replace(/[._]/g, ' ')
              .trim() ||
            emailUsername ||
            'Người dùng CTU',
          studentId: normalizedRole === RoleEnum.STUDENT ? (response?.studentId || fallbackStudentId) : undefined,
          role: normalizedRole,
          roles: rolesArray,
          createdAt: response?.createdAt || new Date().toISOString(),
          isProfileComplete: true,
        }

    // Attempt to enrich student user info from real profile if available
    if (normalizedRole === RoleEnum.STUDENT) {
      try {
        const profileRes: any = await apiClient.get('/users/me/profile')
        if (profileRes) {
          if (profileRes.studentId) user.studentId = profileRes.studentId
          const realName = `${profileRes.lastName || ''} ${profileRes.firstName || ''}`.trim()
          if (realName) user.name = realName
          if (profileRes.avatarUrl) user.avatarUrl = profileRes.avatarUrl
        }
      } catch {
        // Fallback gracefully
      }
    }

    const tokens: AuthTokens = response?.tokens || {
      accessToken: response?.accessToken || undefined,
    }

    return {
      ...response,
      user,
      tokens,
    }
  },

  /**
   * Register new account with university email and password
   */
  async register(payload: RegisterPayload): Promise<{ success: boolean; email: string }> {
    await apiClient.post('/auth/register', payload)
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
    const pendingRaw = sessionStorage.getItem('pending_registration')
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null

    if (pending?.password) {
      const parts = (payload.fullName || '').trim().split(' ')
      const lastName = parts.length > 1 ? parts[0] : 'Sinh viên'
      const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU'

      const kMatch = (payload.academicYear || '').match(/\d+/)
      const kNumber = kMatch ? parseInt(kMatch[0], 10) : 49

      const registerDto = {
        email: pending.email,
        password: pending.password,
        providerId: 'LOCAL',
        firstName,
        lastName,
        studentId: payload.studentId || 'B2303827',
        gender: payload.gender || 'MALE',
        kNumber,
        associationId: 1,
        majorId: 1,
      }

      await apiClient.post('/auth/register', registerDto)
      addRegisteredEmail(pending.email)
      sessionStorage.removeItem('pending_registration')
      const loginRes = await this.login({
        email: pending.email,
        password: pending.password,
      })

      const user: User = {
        ...loginRes.user,
        name: payload.fullName || loginRes.user.name,
        studentId: payload.studentId || loginRes.user.studentId,
        isProfileComplete: true,
      }
      return user
    }

    return apiClient.post('/auth/student-profile', payload)
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
  async exchangeGoogleToken(payload: GoogleAuthPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/google', payload)
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
