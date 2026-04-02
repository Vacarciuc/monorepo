import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsPositive, IsUUID, Min } from 'class-validator'

export class AddToCartDto {
  @ApiProperty({ description: 'Product UUID from seller-service', format: 'uuid' })
  @IsUUID()
  product_id: string

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity: number
}
