import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ description: 'Product UUID', format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity (0 = remove)',
    minimum: 0,
    example: 3,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;
}
