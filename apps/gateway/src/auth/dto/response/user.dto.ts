import { ApiProperty } from '@nestjs/swagger'

import { UserRole } from '@/auth/user-role'

export class UserDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  createdAt: Date

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole

  @ApiProperty()
  email: string

  @ApiProperty()
  username: string
}
