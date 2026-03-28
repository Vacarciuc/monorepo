import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { Product } from './product.entity'

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  user_id: string

  @Column('uuid')
  product_id: string

  @Column('int')
  quantity: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @CreateDateColumn()
  created_at: Date
}
