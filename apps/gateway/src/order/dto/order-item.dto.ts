import { ApiProperty } from '@nestjs/swagger'

export class OrderItemDto {
  @ApiProperty()
  product_id: string

  @ApiProperty()
  quantity: number

  @ApiProperty()
  price: number
}
