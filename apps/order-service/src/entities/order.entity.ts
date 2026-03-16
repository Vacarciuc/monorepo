import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

const moneyToCentsTransformer = {
  to: (value: number) => Math.round(value * 100),
  from: (value: string | number) => Number(value) / 100,
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  seller_id: string;

  // Stored as integer cents in DB to avoid decimal/string issues.
  @Column('int', { name: 'total_price_cents', transformer: moneyToCentsTransformer })
  total_price: number;

  @Column({
    type: 'varchar',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

