export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  role: UserRole;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

