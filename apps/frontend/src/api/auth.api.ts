import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, UserRole } from '../types/user';

/** Decode JWT payload without verification (browser-side, for role extraction only) */
function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

/** Normalise the role from the JWT (auth-service uses lowercase 'user') */
function normaliseRole(raw: string | undefined): UserRole {
  if (!raw) return 'CUSTOMER';
  const upper = raw.toUpperCase();
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'SELLER') return 'SELLER';
  return 'CUSTOMER';
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // auth-service returns a raw JWT string
  const response = await apiClient.post<string>('/auth/login', credentials);
  const token = response.data;
  const payload = decodeJwtPayload(token);
  return {
    accessToken: token,
    role: normaliseRole(payload.role),
  };
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await apiClient.post('/auth/register', data);
};


