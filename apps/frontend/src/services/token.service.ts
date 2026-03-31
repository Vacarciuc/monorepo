import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'

export const tokenService = {
  saveToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' })
    localStorage.setItem(TOKEN_KEY, token)
  },

  getToken(): string | null {
    const cookieToken = Cookies.get(TOKEN_KEY)
    if (cookieToken) return cookieToken
    return localStorage.getItem(TOKEN_KEY)
  },

  removeToken(): void {
    Cookies.remove(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  },

  hasToken(): boolean {
    return !!this.getToken()
  },

  /** Decode JWT payload and return the `sub` field (user id). */
  getUserId(): string | null {
    const token = this.getToken()
    if (!token) return null
    try {
      const base64Payload = token.split('.')[1]
      const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
      const payload = JSON.parse(decoded)
      return payload.sub ? String(payload.sub) : null
    } catch {
      return null
    }
  },
}
