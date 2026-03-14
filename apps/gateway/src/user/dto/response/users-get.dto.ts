import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

import { UserDto } from '@/user/dto/response/user.dto';
import { PaginatedResponseDto } from '@/common/dto/response/paginated-response.dto';

@Exclude()
export class UsersGetDto extends PaginatedResponseDto<UserDto> {
   @Expose()
   @ApiProperty({ type: [UserDto] })
   @Type(() => UserDto)
   items: UserDto[] = null!;
}
