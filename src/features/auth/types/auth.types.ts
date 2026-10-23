/**
 * Canonical System Roles matching CTU Domain Enums (RoleEnum in backend)
 * The system strictly consists of 3 roles:
 * - STUDENT: Enrolled students participating in events, scoring criteria points, receiving certificates.
 * - FANPAGE_ADMIN: Event organizers and managers representing organizations/clubs.
 * - ADMIN: System administrators managing global configurations, fanpage approvals, and users.
 */
export const RoleEnum = {
  STUDENT: 'STUDENT',
  FANPAGE_ADMIN: 'FANPAGE_ADMIN',
  ADMIN: 'ADMIN',
  ROLE_STUDENT: 'ROLE_STUDENT',
  ROLE_FANPAGE_ADMIN: 'ROLE_FANPAGE_ADMIN',
  ROLE_ADMIN: 'ROLE_ADMIN',
} as const

export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum]

export type UserRole = RoleEnum

export const STAFF_ROLES: UserRole[] = [
  RoleEnum.FANPAGE_ADMIN,
  RoleEnum.ADMIN,
  RoleEnum.ROLE_FANPAGE_ADMIN,
  RoleEnum.ROLE_ADMIN,
]

export const STUDENT_ROLES: UserRole[] = [
  RoleEnum.STUDENT,
  RoleEnum.ROLE_STUDENT,
]

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  roles?: string[]
  createdAt: string
  isProfileComplete?: boolean
  studentId?: string
}

export interface AuthTokens {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
}

export interface BackendLoginResponseDto {
  userId: number
  email: string
  roles: string[]
  role: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  userId?: number | string
  email?: string
  roles?: string[]
  role?: string
}

export interface GoogleAuthPayload {
  credential: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  confirmPassword?: string
}

export interface OtpPayload {
  email: string
  otp: string
}

export interface StudentProfilePayload {
  fullName: string
  studentId: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  email: string
  faculty: string
  major: string
  className: string
  academicYear: string
}

export interface StaffProfilePayload {
  fullName: string
  staffId: string
  department: string
  position: string
  workEmail: string
  phoneNumber: string
  termsAccepted: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
