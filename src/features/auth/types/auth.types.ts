export type UserRole = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN' | 'STUDENT' | 'FANPAGE_ADMIN'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
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
