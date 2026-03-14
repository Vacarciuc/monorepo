import { UserRole } from '@/user/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
   IsEmail,
   IsEnum,
   IsNotEmpty,
   IsOptional,
   IsString,
   MaxLength,
   MinLength,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateUserDto {
   @Expose()
   @ApiProperty({ type: String })
   @IsNotEmpty()
   @MinLength(3)
   @MaxLength(255)
   @IsOptional()
   username?: string;

   @Expose()
   @ApiProperty({ type: String })
   @IsEmail()
   @IsNotEmpty()
   @MinLength(6)
   @MaxLength(255)
   @IsOptional()
   email?: string;

   @Expose()
   @ApiProperty({ type: String, nullable: true })
   @IsString()
   @IsOptional()
   preferences?: string | null;

   @Expose()
   @ApiProperty({ type: String, enum: UserRole })
   @IsOptional()
   @IsEnum(UserRole)
   role?: UserRole;
}
