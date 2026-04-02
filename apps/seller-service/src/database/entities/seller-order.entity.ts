import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../../dto/order-created.event';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

@Entity('seller_orders')
export class SellerOrder {
  @ApiProperty({ description: 'Unique identifier', format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Original order ID from the order service',
    format: 'uuid',
  })
  @Column('uuid')
  orderId: string;

  @ApiProperty({
    description: 'Current status of the order',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Column({ type: 'varchar', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({
    description: 'Order items snapshot (productId, quantity, price)',
    type: 'array',
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  orderItems: OrderItem[];

  @ApiProperty({
    description: 'Timestamp when the order was processed',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({
    type: 'jsonb', nullable: false
  })
  order: Record<string, unknown>;

  @ApiProperty({ description: 'Timestamp when the order was received' })
  @CreateDateColumn()
  createdAt: Date;
}
