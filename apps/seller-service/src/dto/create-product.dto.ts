import { IsString, IsNumber, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Laptop Dell XPS 13',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-performance laptop with Intel Core i7 processor',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 1299.99,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Available stock quantity',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Seller unique identifier (optional, defaults to default seller)',
    example: '223e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;
}

