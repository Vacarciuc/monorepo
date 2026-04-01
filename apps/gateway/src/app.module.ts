import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'

import { AuthGuard } from '@/auth/auth.guard'
import { AuthModule } from '@/auth/auth.module'
import { RolesGuard } from '@/auth/roles.guard'
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor'
import { ENV_CONFIG } from '@/config/env.config'
import { GLOBAL_VALIDATION_PIPE_CONFIG } from '@/config/global-validation-pipe.config'
import { HealthModule } from '@/health/health.module'
import { OrderModule } from '@/order/order.module'
import { SellerModule } from '@/seller/seller.module'
import { MetricsModule } from '@/metrics/metrics.module'
import { TotalRequestsMetricsInterceptor } from '@/metrics/total-requests-metrics.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot(ENV_CONFIG),
    HealthModule,
    AuthModule,
    OrderModule,
    SellerModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_PIPE, useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_CONFIG) },
    { provide: APP_INTERCEPTOR, useClass: TotalRequestsMetricsInterceptor },
  ],
  exports: [],
})
export class AppModule {}
