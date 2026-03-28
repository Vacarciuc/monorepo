import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SellerOrder } from '../database/entities/seller-order.entity';
import { Product } from '../database/entities/product.entity';
import { Cart } from '../database/entities/cart.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'seller_db',
  entities: [SellerOrder, Product, Cart],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
});
