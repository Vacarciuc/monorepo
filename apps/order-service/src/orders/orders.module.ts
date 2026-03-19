import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity'; 
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]), 
    ProductsModule,
    CartModule,
    RabbitMQModule,
    OutboxModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}