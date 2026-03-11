import { IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 3, description: 'New quantity' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];
}

