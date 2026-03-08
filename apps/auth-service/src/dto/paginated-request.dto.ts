import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

import { TransformInt } from '@/decorators'

export abstract class PaginatedRequestDto {
  @TransformInt()
  @IsInt()
  @Min(0)
  @ApiProperty({ default: 0 })
  offset: number = 0

  @TransformInt()
  @IsInt()
  @Min(0)
  @ApiProperty({ default: 10 })
  limit: number = 10
}
