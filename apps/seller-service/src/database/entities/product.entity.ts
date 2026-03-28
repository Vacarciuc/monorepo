import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

@Entity('products')
export class Product {
  @ApiProperty({
    description: 'Unique identifier for the product',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Laptop Dell XPS 13',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop with Intel Core i7 processor',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 1299.99,
    minimum: 0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Available stock quantity (units)',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Column({ type: 'int', default: 0, name: 'quantity' })
  quantity: number;

  @ApiProperty({
    description: 'Path to product image',
    example: '/uploads/products/1711234567890-laptop.png',
    required: false,
  })
  @Column({ type: 'varchar', nullable: true, name: 'image_path' })
  imagePath: string;

  @ApiProperty({
    description: 'Seller unique identifier',
    example: '223e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @ApiProperty({
    description: 'Timestamp when the product was created',
    example: '2026-03-15T10:30:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the product was last updated',
    example: '2026-03-15T15:45:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
