import { UserRole } from '@/auth/user-role'

export interface DecodedJwt {
  sub: number
  email: string
  role: UserRole
  iat: number
  exp: number
  aud: string
  iss: string
}
