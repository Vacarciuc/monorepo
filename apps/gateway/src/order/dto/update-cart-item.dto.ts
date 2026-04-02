import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsPositive, Min } from 'class-validator'

export class UpdateCartItemDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity: number
}
