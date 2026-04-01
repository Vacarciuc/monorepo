import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

import { UserRole } from '@/auth/user-role'

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  role: UserRole
}

