import { apiClient } from '@/shared'
import { normalizeRole } from '../utils/authUtils'
import { RoleEnum } from '../types/auth.types'
import type {
  AuthResponse,
  AuthTokens,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  OtpPayload,
  StudentProfilePayload,
  StaffProfilePayload,
  User,
} from '../types/auth.types'

export const authService = {
  /**
   * Login with email and password
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response: any = await apiClient.post('/auth/login', payload)

    // Adapt both canonical Spring Boot flat response ({ userId, email, roles, role })
    // and nested mock server response ({ user, tokens })
    const rawRole = response?.role || response?.roles?.[0] || response?.user?.role || RoleEnum.STUDENT
    const normalizedRole = normalizeRole(rawRole) || RoleEnum.STUDENT
    const emailUsername = (response?.email || payload.email).split('@')[0] || ''
    const rolesArray = response?.roles || (response?.role ? [response.role] : [rawRole])

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
              .replace(/[._]/g, ' ')
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ') ||
            'Người dùng CTU',
          studentId: normalizedRole === RoleEnum.STUDENT ? emailUsername.toUpperCase() : undefined,
          role: normalizedRole,
          roles: rolesArray,
          createdAt: response?.createdAt || new Date().toISOString(),
          isProfileComplete: true,
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
    return { success: true, email: payload.email }
  },

  /**
   * Verify 6-digit OTP code sent to user email
   */
  async verifyOtp(payload: OtpPayload): Promise<{ success: boolean; user: User }> {
    return apiClient.post('/auth/verify-otp', payload)
  },

  /**
   * Resend OTP code to email
   */
  async resendOtp(email: string): Promise<boolean> {
    await apiClient.post('/auth/resend-otp', { email })
    return true
  },

  /**
   * Complete student profile on first login/registration
   */
  async completeStudentProfile(payload: StudentProfilePayload): Promise<User> {
    return apiClient.post('/auth/student-profile', payload)
  },

  /**
   * Complete staff profile on first login/registration
   */
  async completeStaffProfile(payload: StaffProfilePayload): Promise<User> {
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
