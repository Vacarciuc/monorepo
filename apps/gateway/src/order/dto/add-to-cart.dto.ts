import { ApiProperty } from '@nestjs/swagger'

export class AddToCartDto {
  @ApiProperty()
  product_id: string

  @ApiProperty()
  quantity: number
}
