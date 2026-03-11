import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Seller } from '../../domain/entities/seller.entity';
import { Product } from '../../domain/entities/product.entity';
import { Cart } from '../../domain/entities/cart.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'seller_service',
  entities: [Seller, Product, Cart],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
};

