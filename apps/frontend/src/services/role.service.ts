import Cookies from 'js-cookie'

import type { UserRole } from '../types/user'

const ROLE_KEY = 'user_role'

export const roleService = {
  saveRole(role: UserRole): void {
    Cookies.set(ROLE_KEY, role, { expires: 7, sameSite: 'strict' })
    localStorage.setItem(ROLE_KEY, role)
  },

  getRole(): UserRole | null {
    const cookieRole = Cookies.get(ROLE_KEY)
    if (cookieRole) {
      return cookieRole as UserRole
    }
    return localStorage.getItem(ROLE_KEY) as UserRole | null
  },

  removeRole(): void {
    Cookies.remove(ROLE_KEY)
    localStorage.removeItem(ROLE_KEY)
  },

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN'
  },

  isCustomer(): boolean {
    return this.getRole() === 'CUSTOMER'
  },

  isSeller(): boolean {
    return this.getRole() === 'SELLER'
  },
}
