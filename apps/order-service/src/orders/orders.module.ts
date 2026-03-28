import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CartModule } from '../cart/cart.module'
import { OrderItem } from '../entities/order-item.entity'
import { Order } from '../entities/order.entity'
import { Product } from '../entities/product.entity'
import { OutboxModule } from '../outbox/outbox.module'
import { ProductsModule } from '../products/products.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

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
