import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../database/entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product UUID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiProperty({ description: 'Product price', minimum: 0 })
  price: number;

  @ApiProperty({
    description: 'Available stock quantity',
    minimum: 0,
    default: 0,
  })
  quantity: number;

  @ApiPropertyOptional({ description: 'Image URL path' })
  imagePath?: string;

  @ApiProperty({ description: 'Seller UUID', format: 'uuid' })
  sellerId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description ?? undefined;
    dto.price = Number(product.price);
    dto.quantity = product.quantity ?? 0;
    dto.imagePath = product.imagePath ?? undefined;
    dto.sellerId = product.sellerId;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }

  static fromEntities(products: Product[]): ProductResponseDto[] {
    return products.map((p) => ProductResponseDto.fromEntity(p));
  }
}
