import { IsString, IsNumber, IsOptional, IsUUID, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Seller ID' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ example: 'Laptop', description: 'Product name' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ example: 'High-end gaming laptop' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1299.99, description: 'Product price' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ example: 10, description: 'Stock quantity' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Gaming Laptop Pro' })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1199.99 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  stock?: number;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  createdAt: Date;
}

