import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose } from 'class-transformer'
import { IsEmail, MaxLength, MinLength } from 'class-validator'

@Exclude()
export class RegisterDto {
  @Expose()
  @ApiProperty()
  @IsEmail()
  email: string

  @Expose()
  @ApiProperty()
  @MinLength(3)
  @MaxLength(30)
  username: string

  @Expose()
  @ApiProperty()
  @MinLength(8)
  @MaxLength(30)
  password: string
}
