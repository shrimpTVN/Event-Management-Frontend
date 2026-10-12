export type UserRole = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
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

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
