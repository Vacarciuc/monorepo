import type { User, UserRole } from '../types/user'
import apiClient from './client'

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/auth/users')
  // Normalizăm rolul din enum-ul backend (user/admin/seller) → uppercase
  return response.data.map(normaliseUser)
}

export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/auth/users/${id}`)
  return normaliseUser(response.data)
}

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/auth/users/${id}`)
}

export const updateUserRole = async (id: number, role: UserRole): Promise<User> => {
  const response = await apiClient.patch<User>(`/auth/users/${id}/role`, {
    role: role.toLowerCase(),
  })
  return normaliseUser(response.data)
}

/** Normalizare rol backend (lowercase) → UserRole frontend (uppercase) */
function normaliseUser(user: any): User {
  const raw: string = user.role ?? ''
  const upper = raw.toUpperCase()
  const role: UserRole =
    upper === 'ADMIN' ? 'ADMIN' : upper === 'SELLER' ? 'SELLER' : 'CUSTOMER'
  return { ...user, role }
}

