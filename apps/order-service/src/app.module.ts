import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { Product } from './entities/product.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('ORDER_SERVICE_DB_HOST', ),
        port: configService.get('ORDER_SERVICE_DB_PORT', ),
        username: configService.get('ORDER_SERVICE_DB_USER', ),
        password: configService.get('ORDER_SERVICE_DB_PASSWORD', ),
        database: configService.get('ORDER_SERVICE_DB_NAME',),
        entities: [Product, CartItem, Order, OrderItem, OutboxEvent],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
    CartModule,
    OrdersModule,
    RabbitMQModule,
  ],
})
export class AppModule {}


