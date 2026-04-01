import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateSellerProductDto {
  @ApiProperty({ example: 'Laptop Dell XPS 13', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string

  @ApiPropertyOptional({ example: 'High-performance laptop with Intel Core i7 processor' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 1299.99, minimum: 0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number

  @ApiPropertyOptional({ example: 100, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  quantity?: number

  @ApiPropertyOptional({
    example: '223e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string
}

export class UpdateSellerProductDto {
  @ApiPropertyOptional({ example: 'Laptop Dell XPS 15', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ example: 1499.99, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number

  @ApiPropertyOptional({ example: 50, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  quantity?: number
}

export class SellerProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  description?: string

  @ApiProperty()
  price: number

  @ApiProperty()
  quantity: number

  @ApiPropertyOptional()
  imagePath?: string

  @ApiProperty({ format: 'uuid' })
  sellerId: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}

