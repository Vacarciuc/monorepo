import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

import { UserRole } from '@/user/enums/user-role.enum';

@Exclude()
export class UserDto {
   @Expose()
   @ApiProperty({ type: String })
   username: string = null!;

   @Expose()
   @ApiProperty({ type: String })
   email: string = null!;

   @Expose()
   @ApiProperty({ type: Date })
   createdAt: string = null!;

   @Expose()
   @ApiProperty({ type: Number })
   id: number = null!;

   @Expose()
   @ApiProperty({ type: Boolean })
   deleted: boolean = null!;

   @Expose()
   @ApiProperty({ type: Date, nullable: true })
   deletedAt: Date | null = null;

   @Expose()
   @ApiProperty({ type: String, nullable: true })
   preferences: string | null = null;

   @Expose()
   @ApiProperty({ type: String, enum: UserRole })
   role: UserRole = null!;
}
