export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SELLER'

export interface User {
  id: number
  email: string
  username: string
  role: UserRole
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  role: UserRole
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}
