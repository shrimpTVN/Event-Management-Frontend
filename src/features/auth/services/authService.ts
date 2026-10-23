import { apiClient, isMockMode } from '@/shared'
import { isStaffEmail, normalizeRole } from '../utils/authUtils'
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
    try {
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

      const mock = isMockMode()
      const tokens: AuthTokens = response?.tokens || {
        accessToken: response?.accessToken || (mock ? `mock-jwt-token-${user.id}-${Date.now()}` : undefined),
      }

      return {
        ...response,
        user,
        tokens,
      }
    } catch (err: any) {
      // Mock fallback ONLY in mock mode if mock server is offline
      if (isMockMode() && (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK')) {
        const isStaff = isStaffEmail(payload.email)
        const emailUsername = payload.email.split('@')[0] || ''
        const defaultName = emailUsername
          .replace(/[._]/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') || (isStaff ? 'Cán bộ Ban Tổ Chức' : 'Sinh viên CTU')

        const assignedRole = isStaff ? RoleEnum.FANPAGE_ADMIN : RoleEnum.STUDENT
        const mockUser: User = {
          id: isStaff ? 'usr-staff-1' : 'usr-student-1',
          name: defaultName,
          studentId: isStaff ? undefined : emailUsername.toUpperCase(),
          avatarUrl: undefined,
          email: payload.email,
          role: assignedRole,
          roles: [`ROLE_${assignedRole}`],
          createdAt: new Date().toISOString(),
          isProfileComplete: true,
        }
        return {
          user: mockUser,
          tokens: {
            accessToken: `mock-jwt-token-${isStaff ? 2 : 1}-${Date.now()}`,
          },
        }
      }
      throw err
    }
  },

  /**
   * Register new account with university email and password
   */
  async register(payload: RegisterPayload): Promise<{ success: boolean; email: string }> {
    try {
      await apiClient.post('/auth/register', payload)
      return { success: true, email: payload.email }
    } catch (err: any) {
      if (isMockMode() && (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK')) {
        return { success: true, email: payload.email }
      }
      throw err
    }
  },

  /**
   * Verify 6-digit OTP code sent to user email
   */
  async verifyOtp(payload: OtpPayload): Promise<{ success: boolean; user: User }> {
    try {
      const response: any = await apiClient.post('/auth/verify-otp', payload)
      return response
    } catch (err: any) {
      if (isMockMode() && (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK')) {
        const isStaff = isStaffEmail(payload.email)
        const mockUser: User = {
          id: isStaff ? 'usr-staff-1' : 'usr-student-1',
          name: isStaff ? 'Cán bộ quản lý CTU' : 'Sinh viên CTU',
          email: payload.email,
          role: isStaff ? RoleEnum.FANPAGE_ADMIN : RoleEnum.STUDENT,
          createdAt: new Date().toISOString(),
          isProfileComplete: false,
        }
        return { success: true, user: mockUser }
      }
      throw err
    }
  },

  /**
   * Resend OTP code to email
   */
  async resendOtp(email: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/resend-otp', { email })
      return true
    } catch (err) {
      if (isMockMode()) return true
      throw err
    }
  },

  /**
   * Complete student profile on first login/registration
   */
  async completeStudentProfile(payload: StudentProfilePayload): Promise<User> {
    try {
      const response: any = await apiClient.post('/auth/student-profile', payload)
      return response
    } catch (err: any) {
      if (isMockMode() && (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK')) {
        return {
          id: 'usr-student-1',
          name: payload.fullName,
          email: payload.email,
          role: 'STUDENT',
          createdAt: new Date().toISOString(),
          isProfileComplete: true,
        }
      }
      throw err
    }
  },

  /**
   * Complete staff profile on first login/registration
   */
  async completeStaffProfile(payload: StaffProfilePayload): Promise<User> {
    try {
      const response: any = await apiClient.post('/auth/staff-profile', payload)
      return response
    } catch (err: any) {
      if (isMockMode() && (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK')) {
        return {
          id: 'usr-staff-1',
          name: payload.fullName,
          email: payload.workEmail,
          role: RoleEnum.FANPAGE_ADMIN,
          createdAt: new Date().toISOString(),
          isProfileComplete: true,
        }
      }
      throw err
    }
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
