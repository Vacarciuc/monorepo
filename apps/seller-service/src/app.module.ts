import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './infrastructure/config/typeorm.config';
import { RabbitMQModule } from './messaging/rabbitmq/rabbitmq.module';

// Entities
import { Seller, Product, Cart } from './domain/entities';

// Repositories
import { SellerRepository, ProductRepository, CartRepository } from './domain/repositories';

// Use Cases
import { SellerUseCases } from './application/use-cases/seller.usecase';
import { ProductUseCases } from './application/use-cases/product.usecase';
import { CartUseCases } from './application/use-cases/cart.usecase';

// Controllers
import { SellerController } from './infrastructure/controllers/seller.controller';
import { ProductController, SellerProductController } from './infrastructure/controllers/product.controller';
import { CartController } from './infrastructure/controllers/cart.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Seller, Product, Cart]),
    RabbitMQModule,
  ],
  controllers: [
    SellerController,
    ProductController,
    SellerProductController,
    CartController,
  ],
  providers: [
    // Repositories
    SellerRepository,
    ProductRepository,
    CartRepository,
    // Use Cases
    SellerUseCases,
    ProductUseCases,
    CartUseCases,
  ],
})
export class AppModule {}


