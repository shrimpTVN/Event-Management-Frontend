import { apiClient } from '@/shared/services/api'
import { isStaffEmail } from '../utils/authUtils'
import type {
  AuthResponse,
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
      return response
    } catch (err: any) {
      // Development mock fallback if backend is offline
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        const isStaff = isStaffEmail(payload.email)
        const mockUser: User = {
          id: isStaff ? 'usr-staff-1' : 'usr-student-1',
          name: isStaff ? 'Nguyễn Minh Anh' : 'Đoàn Tài Lộc',
          studentId: isStaff ? undefined : 'B2303827',
          avatarUrl: isStaff
            ? undefined
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          email: payload.email,
          role: isStaff ? 'ORGANIZER' : 'STUDENT',
          createdAt: new Date().toISOString(),
          isProfileComplete: true,
        }
        return {
          user: mockUser,
          tokens: {
            accessToken: 'mock-jwt-token-' + Date.now(),
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
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
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
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        const isStaff = isStaffEmail(payload.email)
        const mockUser: User = {
          id: isStaff ? 'usr-staff-1' : 'usr-student-1',
          name: isStaff ? 'Cán bộ quản lý CTU' : 'Sinh viên CTU',
          email: payload.email,
          role: isStaff ? 'ORGANIZER' : 'STUDENT',
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
    } catch {
      return true
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
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
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
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        return {
          id: 'usr-staff-1',
          name: payload.fullName,
          email: payload.workEmail,
          role: 'ORGANIZER',
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
