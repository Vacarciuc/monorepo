import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthGuard } from '@/auth/auth.guard'
import { ENV_CONFIG } from '@/config/env.config'
import { GLOBAL_VALIDATION_PIPE_CONFIG } from '@/config/global-validation-pipe.config'
import { SCHEDULE_CONFIG } from '@/config/schedule.config'
import { SERVE_STATIC_CONFIG } from '@/config/serve-static.config'
import { TYPEORM_CONFIG } from '@/config/typeorm.config'
import { LoggingInterceptor } from '@/interceptors/logging.interceptor'
import { MetricsModule } from '@/metrics/metrics.module'
import { TotalRequestsMetricsInterceptor } from '@/metrics/total-requests-metrics.interceptor'

import { HealthModule } from '../health/health.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot(ENV_CONFIG),
    TypeOrmModule.forRootAsync(TYPEORM_CONFIG),
    ServeStaticModule.forRootAsync(SERVE_STATIC_CONFIG),
    ScheduleModule.forRoot(SCHEDULE_CONFIG),
    AuthModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_CONFIG),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TotalRequestsMetricsInterceptor,
    },
  ],
  exports: [],
})
export class AppModule {}
