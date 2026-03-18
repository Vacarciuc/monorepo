import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/user';

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await apiClient.post('/auth/register', data);
};


