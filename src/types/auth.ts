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
  accessToken: string
  refreshToken?: string
  expiresIn?: number
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

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
