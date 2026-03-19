import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

const moneyToCentsTransformer = {
  to: (value: number) => Math.round(value * 100),
  from: (value: string | number) => Number(value) / 100,
};

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  order_id: string;

  @Column('uuid')
  product_id: string;

  @Column('int')
  quantity: number;

  // Stored as integer cents in DB to avoid decimal/string issues.
  @Column('int', { name: 'price_cents', transformer: moneyToCentsTransformer })
  price: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

