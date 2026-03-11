import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export class CartItem {
  productId: string;
  quantity: number;
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  sellerId: string;

  @Column({ type: 'jsonb', default: [] })
  items: CartItem[];
}

