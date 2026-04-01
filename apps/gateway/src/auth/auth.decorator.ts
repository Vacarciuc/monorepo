import {
  SetMetadata,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { AuthGuard } from '@/auth/auth.guard'
import { UserRole } from '@/auth/user-role'
import { AppRequest } from '@/types/app-request.types'

export const IS_PUBLIC_DECORATOR_KEY = 'is_public'

export const Public = () =>
  applyDecorators(SetMetadata(IS_PUBLIC_DECORATOR_KEY, true))

export const Authorize = () =>
  applyDecorators(
    ApiBearerAuth(),
    UseGuards(AuthGuard),
    ApiUnauthorizedResponse,
  )

export const ROLE_METADATA_KEY = 'role'

export const RoleHierarchy = [UserRole.User, UserRole.Seller, UserRole.Admin]

export const Role = (role: UserRole) =>
  applyDecorators(
    SetMetadata(ROLE_METADATA_KEY, role),
    ApiBearerAuth(),
    UseGuards(AuthGuard),
    ApiOperation({ summary: role }, { overrideExisting: true }),
  )

// Get the user that is logged in if the JWT
export const RequestUser = createParamDecorator<any>((data, ctx) => {
  const request: AppRequest = ctx.switchToHttp().getRequest()
  const user = request.user

  if (!user) {
    return null
  }

  user.sub = Number(user.sub) as any
  return user
})
