import { ApiProperty } from '@nestjs/swagger'

export class SellerOrderItemDto {
  @ApiProperty()
  productId: string

  @ApiProperty()
  quantity: number

  @ApiProperty()
  price: number
}

/** O comandă pendintă citită direct din coadă (fără DB) */
export class PendingSellerOrderDto {
  @ApiProperty({ format: 'uuid', description: 'ID din order-service' })
  orderId: string

  @ApiProperty({ format: 'uuid' })
  sellerId: string

  @ApiProperty({ type: [SellerOrderItemDto] })
  items: SellerOrderItemDto[]

  @ApiProperty()
  totalPrice: number

  @ApiProperty({ description: 'Momentul sosirii mesajului în seller-service' })
  receivedAt: string
}

/** Răspuns după confirmare / respingere */
export class OrderActionResultDto {
  @ApiProperty({ format: 'uuid' })
  orderId: string

  @ApiProperty({ enum: ['CONFIRMED', 'REJECTED'] })
  status: 'CONFIRMED' | 'REJECTED'
}
