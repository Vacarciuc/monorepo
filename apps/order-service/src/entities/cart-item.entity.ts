import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50 })
  user_id: string

  @Column('uuid')
  product_id: string

  @Column('int')
  quantity: number


  @CreateDateColumn()
  created_at: Date
}
