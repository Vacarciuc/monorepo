import { ApiProperty } from '@nestjs/swagger'

export enum SellerOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export class SellerOrderItemDto {
  @ApiProperty()
  productId: string

  @ApiProperty()
  quantity: number

  @ApiProperty()
  price: number
}

export class SellerOrderDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  orderId: string

  @ApiProperty({ enum: SellerOrderStatus, enumName: 'SellerOrderStatus' })
  status: SellerOrderStatus

  @ApiProperty({ type: [SellerOrderItemDto] })
  orderItems: SellerOrderItemDto[]

  @ApiProperty({ nullable: true })
  processedAt: Date | null

  @ApiProperty()
  createdAt: Date
}

