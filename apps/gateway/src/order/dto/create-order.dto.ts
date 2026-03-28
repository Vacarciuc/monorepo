import { ApiProperty } from '@nestjs/swagger'

import { OrderItemDto } from '@/order/dto/order-item.dto'

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[]
}
