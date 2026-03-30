import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { SellerModule } from './modules/seller/seller.module';
import { ProductModule } from './modules/products/product.module';
import { CartModule } from './modules/cart/cart.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TotalRequestsMetricsInterceptor } from './modules/metrics/total-requests-metrics.interceptor';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    SellerModule,
    ProductModule,
    CartModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TotalRequestsMetricsInterceptor,
    },
  ],
})
export class AppModule {}
