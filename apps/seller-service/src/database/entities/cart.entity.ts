import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export interface CartItemJson {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imagePath?: string;
}

/**
 * Persistent shopping cart per customer.
 * `items` is a JSONB column — ready-to-send payload for RabbitMQ / Orders service.
 */
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Customer identifier (sub from JWT)',
    format: 'uuid',
  })
  @Column({ type: 'varchar', name: 'customer_id', unique: true })
  customerId: string;

  @ApiProperty({ description: 'Cart items (JSONB)', type: 'array' })
  @Column({ type: 'jsonb', default: '[]' })
  items: CartItemJson[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
