import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

const moneyToCentsTransformer = {
  to: (value: number) => Math.round(value * 100),
  from: (value: string | number) => Number(value) / 100,
};

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Stored as integer cents in DB to avoid decimal/string issues.
  @Column('int', { name: 'price_cents', transformer: moneyToCentsTransformer })
  price: number;

  @Column('int')
  stock: number;

  @Column('uuid')
  seller_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

