import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

@Entity('seller_orders')
export class SellerOrder {
  @ApiProperty({
    description: 'Unique identifier for the seller order record',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Original order ID from the order service',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @Column('uuid')
  orderId: string;

  @ApiProperty({
    description: 'Current status of the order',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    default: OrderStatus.PENDING,
  })
  @Column({
    type: 'varchar',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Timestamp when the order was processed (confirmed or rejected)',
    example: '2026-03-12T10:30:00.000Z',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @ApiProperty({
    description: 'Timestamp when the order was received',
    example: '2026-03-12T10:29:55.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}

