import type { UserRole } from '@/auth/user-role.enum'

export interface DecodedJwt {
  sub: number
  email: string
  role: UserRole
  iat: number
  exp: number
  aud: string
  iss: string
}
