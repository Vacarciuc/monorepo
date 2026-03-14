import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
   @ApiProperty({ type: String })
   @IsEmail()
   @IsNotEmpty()
   @MaxLength(255)
   email: string = null!;

   @ApiProperty({ type: String })
   @IsNotEmpty()
   @MaxLength(255)
   password: string = null!;
}
