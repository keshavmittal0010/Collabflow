// ============================================================
// AUTH TYPES
// ============================================================

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  bio: string | null
  timezone: string
  theme: 'light' | 'dark' | 'system'
  isOnline: boolean
  lastSeen: Date | null
  createdAt: Date
  updatedAt: Date
}

export type AuthUser = Omit<User, 'createdAt' | 'updatedAt'>

export interface JwtPayload {
  sub: string     // user id
  email: string
  name: string
  iat: number
  exp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

// ============================================================
// API TYPES
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
  pagination?: Pagination
}

export interface ApiError {
  success: false
  error: string
  message: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================================
// REGISTER / LOGIN TYPES
// ============================================================

export interface RegisterInput {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  password: string
  confirmPassword: string
}
