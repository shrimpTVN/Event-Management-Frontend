import { educationCatalogService } from '@/shared/services/educationCatalogService'
import { apiClient } from '@/shared'
import { beginLogoutTransition, endLogoutTransition } from '@/shared/services/authRefresh'
import { isMockMode } from '@/shared/utils/env'
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
import { useAuthStore } from '../store/authStore'

async function formatAuthUser(response: any, fallbackEmail: string): Promise<AuthResponse> {
  const data = response?.data || response
  if (!isMockMode()) {
    const validUserId = Number.isSafeInteger(Number(data?.userId)) && Number(data.userId) > 0
    const validEmail = typeof data?.email === 'string' && data.email.trim().length > 0
    const validRoles = Array.isArray(data?.roles) && data.roles.length > 0
    if (!validUserId || !validEmail || !validRoles || !normalizeRole(data?.role)) {
      throw new Error('Invalid authentication response from backend: userId, email or role is missing')
    }
  }
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
          emailUsername.replace(/[0-9]/g, '').replace(/[._]/g, ' ').trim() ||
          emailUsername ||
          'Người dùng CTU',
        studentId:
          normalizedRole === RoleEnum.STUDENT ? data?.studentId || fallbackStudentId : undefined,
        role: normalizedRole,
        roles: rolesArray,
        createdAt: data?.createdAt || new Date().toISOString(),
        isProfileComplete: Boolean(data?.isProfileComplete || data?.user?.isProfileComplete),
      }

  try {
    const profileRes: any = await apiClient.get('/users/me/profile')
    const pData = profileRes?.data || profileRes
    if (pData) {
      const studentProfile =
        pData.studentProfile && typeof pData.studentProfile === 'object'
          ? pData.studentProfile
          : pData.studentId
            ? pData
            : null
      if (pData.userId && (!user.id || user.id === 'usr-1')) {
        user.id = String(pData.userId)
      }
      if (Array.isArray(pData.roles) && pData.roles.length > 0) {
        user.roles = pData.roles
      }
      if (studentProfile?.studentId) user.studentId = studentProfile.studentId
      const realName = `${pData.lastName || ''} ${pData.firstName || ''}`.trim()
      if (realName) user.name = realName
      if (pData.avatarUrl) user.avatarUrl = pData.avatarUrl
      if (normalizedRole === RoleEnum.STUDENT) {
        user.isProfileComplete = Boolean(studentProfile?.studentId)
      } else {
        user.isProfileComplete = true
      }
    }
  } catch {
    if (normalizedRole === RoleEnum.STUDENT) {
      user.isProfileComplete = false
    }
  }

  const tokens: AuthTokens = isMockMode()
    ? data?.tokens || {
        accessToken: data?.accessToken || undefined,
      }
    : {}

  return {
    ...data,
    user,
    tokens,
  }
}

export const authService = {
  async getAccountSecurity(): Promise<{ hasPassword: boolean }> {
    const res: any = await apiClient.get('/users/me/security')
    return { hasPassword: Boolean(res?.hasPassword) }
  },

  async getFanpageRegistrationEligibility(): Promise<{
    status: 'ELIGIBLE' | 'PROFILE_REQUIRED' | string
    reasonCode?: string | null
    requiresReauthentication?: boolean
  }> {
    const res: any = await apiClient.get('/users/me/fanpage-registration-eligibility')
    return {
      status: res?.status || 'PROFILE_REQUIRED',
      reasonCode: res?.reasonCode || null,
      requiresReauthentication: Boolean(res?.requiresReauthentication),
    }
  },

  async createPassword(newPassword: string): Promise<void> {
    await apiClient.post('/auth/create-password', { newPassword })
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword })
  },
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
    const schoolId = payload.schoolId ?? Number(payload.faculty)
    const majorId = payload.majorId ?? Number(payload.major)
    await educationCatalogService.validateSelection(schoolId, majorId)
    const parts = payload.fullName.trim().split(/\s+/)
    const lastName = parts.length > 1 ? parts[0] : ''
    const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]
    const kNumber = Number(payload.academicYear.match(/\d+/)?.[0])
    if (!Number.isInteger(kNumber) || kNumber < 1) throw new Error('Vui lòng chọn khóa học hợp lệ.')
    const current = useAuthStore.getState().user
    const response: any = await apiClient.put('/users/me/profile', {
      firstName,
      lastName,
      gender: payload.gender,
      kNumber,
      majorId,
      schoolId,
      avatarUrl:
        current?.avatarUrl ||
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(payload.studentId),
    })
    const data = response?.data || response
    if (!data?.email || Number(data.majorId) !== majorId || Number(data.schoolId) !== schoolId)
      throw new Error('Máy chủ chưa xác nhận đúng ngành học đã chọn.')
    return {
      ...current,
      id: current?.id || String(data.userId || ''),
      email: data.email,
      name: [data.lastName, data.firstName].filter(Boolean).join(' '),
      studentId: data.studentId,
      avatarUrl: data.avatarUrl,
      role: normalizeRole(data.role) || RoleEnum.STUDENT,
      roles: data.roles || current?.roles || [RoleEnum.STUDENT],
      createdAt: current?.createdAt || new Date().toISOString(),
      isProfileComplete: true,
    }
  },

  /**
   * Complete staff profile on first login/registration
   */
  async completeStaffProfile(payload: StaffProfilePayload): Promise<User> {
    const pendingRaw = sessionStorage.getItem('pending_registration')
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null

    const parts = (payload.fullName || '').trim().split(' ')
    const lastName = parts.length > 1 ? parts[0] : 'Cán bộ'
    const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CTU'

    if (pending?.password) {
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

    const currentUser = useAuthStore.getState().user
    const createDto = {
      firstName,
      lastName,
      gender: 'MALE',
      staffProfile: {
        staffId: (payload.staffId || '').substring(0, 20).trim(),
        orgName: normalizeOrgName(payload.department),
        title: (payload.position || 'Cán bộ').substring(0, 100).trim(),
        dateOfBirth: null,
        phoneNumber: (payload.phoneNumber || '').substring(0, 20).trim() || undefined,
      },
    }

    const response: any = await apiClient.post('/users/me/staff-profile', createDto)
    const updatedUser: User = {
      ...(currentUser || {}),
      id: String(response?.userId || currentUser?.id || 'usr-1'),
      email: response?.email || currentUser?.email || payload.workEmail,
      name:
        `${response?.firstName || firstName} ${response?.lastName || lastName}`.trim() ||
        payload.fullName,
      role: RoleEnum.FANPAGE_ADMIN,
      roles: response?.roles
        ? Array.from(response.roles as Iterable<string>)
        : currentUser?.roles || [RoleEnum.FANPAGE_ADMIN],
      createdAt: currentUser?.createdAt || new Date().toISOString(),
      avatarUrl: response?.avatarUrl || currentUser?.avatarUrl,
      isProfileComplete: true,
      staffId: response?.staffProfile?.staffId || payload.staffId,
    }
    useAuthStore.getState().updateUser(updatedUser)
    return updatedUser
  },

  /**
   * Exchanges Google OAuth credential token with backend
   */
  async exchangeGoogleToken(
    payload: GoogleAuthPayload | { idToken: string }
  ): Promise<AuthResponse> {
    const idToken = 'idToken' in payload ? payload.idToken : payload.credential
    if (!idToken || (!isMockMode() && idToken.startsWith('mock-google-token-'))) {
      throw new Error('Google credential is unavailable')
    }
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
    beginLogoutTransition()
    try {
      await apiClient.post('/auth/logout')
    } finally {
      endLogoutTransition()
    }
  },
}
