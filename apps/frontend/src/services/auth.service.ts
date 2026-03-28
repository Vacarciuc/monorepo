import * as authApi from '../api/auth.api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../types/user'
import { roleService } from './role.service'
import { tokenService } from './token.service'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.login(credentials)
    tokenService.saveToken(response.accessToken)
    roleService.saveRole(response.role)
    return response
  },

  async register(data: RegisterRequest): Promise<void> {
    await authApi.register(data)
  },

  logout(): void {
    tokenService.removeToken()
    roleService.removeRole()
  },

  isAuthenticated(): boolean {
    return tokenService.hasToken()
  },

  getAuthHeader(): { Authorization: string } | {} {
    const token = tokenService.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },

  isAdmin(): boolean {
    return roleService.isAdmin()
  },

  isCustomer(): boolean {
    return roleService.isCustomer()
  },

  isSeller(): boolean {
    return roleService.isSeller()
  },
}
