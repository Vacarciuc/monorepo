import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose } from 'class-transformer'
import { UserRole } from '@/auth/user-role'


@Exclude()
export class UserDto {
  @Expose()
  @ApiProperty()
  id: number

  @Expose()
  @ApiProperty()
  createdAt: Date

  @Expose()
  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole

  @Expose()
  @ApiProperty()
  email: string

  @Expose()
  @ApiProperty()
  username: string
}
