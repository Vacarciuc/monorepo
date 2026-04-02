import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CartModule } from '../cart/cart.module'
import { OrderItem } from '../entities/order-item.entity'
import { Order } from '../entities/order.entity'
import { OutboxModule } from '../outbox/outbox.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { SellerClientModule } from '../seller/seller-client.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
    RabbitMQModule,
    OutboxModule,
    SellerClientModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
