import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CartModule } from './cart/cart.module'
import { CartItem } from './entities/cart-item.entity'
import { OrderItem } from './entities/order-item.entity'
import { Order } from './entities/order.entity'
import { OutboxEvent } from './entities/outbox-event.entity'
import { Product } from './entities/product.entity'
import { MetricsModule } from './metrics/metrics.module'
import { TotalRequestsMetricsInterceptor } from './metrics/total-requests-metrics.interceptor'
import { OrdersModule } from './orders/orders.module'
import { ProductsModule } from './products/products.module'
import { RabbitMQModule } from './rabbitmq/rabbitmq.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env', '.env.development'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('ORDER_SERVICE_DB_HOST'),
        port: configService.get('ORDER_SERVICE_DB_PORT'),
        username: configService.get('ORDER_SERVICE_DB_USER'),
        password: configService.get('ORDER_SERVICE_DB_PASSWORD'),
        database: configService.get('ORDER_SERVICE_DB_NAME'),
        entities: [Product, CartItem, Order, OrderItem, OutboxEvent],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
    CartModule,
    OrdersModule,
    RabbitMQModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TotalRequestsMetricsInterceptor,
    },
  ],
})
export class AppModule {}
