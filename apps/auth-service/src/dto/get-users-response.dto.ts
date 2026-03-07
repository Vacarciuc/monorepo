import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Type } from 'class-transformer'

import { PaginatedResponseDto } from '@/dto/paginated-response.dto'
import { UserDto } from '@/dto/user.dto'

@Exclude()
export class GetUsersResponseDto extends PaginatedResponseDto<UserDto> {
  @Expose()
  @Type(() => UserDto)
  @ApiProperty({ type: [UserDto] })
  items: UserDto[]
}
