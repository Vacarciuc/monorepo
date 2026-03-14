import { UserRole } from '@/user/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
   IsEmail,
   IsEnum,
   IsNotEmpty,
   MaxLength,
   MinLength,
} from 'class-validator';

export class CreateUserDto {
   @ApiProperty({ type: String })
   @IsEmail()
   @IsNotEmpty()
   @MinLength(6)
   @MaxLength(255)
   email: string = null!;

   @ApiProperty({ type: String })
   @IsNotEmpty()
   @MinLength(3)
   @MaxLength(255)
   password: string = null!;

   @ApiProperty({ type: Number, enum: UserRole })
   @IsEnum(UserRole)
   role: UserRole = null!;

   @ApiProperty({ type: String })
   @IsNotEmpty()
   @MinLength(3)
   @MaxLength(255)
   username: string = null!;
}
