import { IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItem {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '323e4567-e89b-12d3-a456-426614174002',
    format: 'uuid',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  price: number;
}

export class OrderCreatedEvent {
  @ApiProperty({
    description: 'Order unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Seller unique identifier',
    example: '223e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID()
  sellerId: string;

  @ApiProperty({
    description: 'List of items in the order',
    type: [OrderItem],
    example: [
      {
        productId: '323e4567-e89b-12d3-a456-426614174002',
        quantity: 2,
        price: 50.0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 100.0,
    minimum: 0,
  })
  @IsNumber()
  totalPrice: number;
}

