import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class LoginDto {
  @Expose()
  @ApiProperty({ example: 'admin@email.com' })
  email: string

  @Expose()
  @ApiProperty({ example: 'password' })
  password: string
}
