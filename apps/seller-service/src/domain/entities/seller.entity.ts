import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';

export enum SellerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ length: 255 })
  companyName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: SellerStatus,
    default: SellerStatus.ACTIVE,
  })
  status: SellerStatus;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];
}

