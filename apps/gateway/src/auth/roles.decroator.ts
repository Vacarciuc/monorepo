import { SetMetadata } from '@nestjs/common'

import { UserRole } from '@/auth/user-role'

export const ROLE_METADATA_KEY = 'role'

export const RoleHierarchy = [UserRole.User, UserRole.Seller, UserRole.Admin]

// Decorator rol
export const Role = (role: UserRole) => SetMetadata(ROLE_METADATA_KEY, role)
