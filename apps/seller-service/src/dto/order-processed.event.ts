import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../database/entities/seller-order.entity';

export class OrderProcessedEvent {
  @ApiProperty({
    description: 'Order unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Processing result status',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

