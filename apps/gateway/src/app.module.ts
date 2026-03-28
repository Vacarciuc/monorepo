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

@Module({
  imports: [ConfigModule.forRoot(ENV_CONFIG), HealthModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(GLOBAL_VALIDATION_PIPE_CONFIG),
    },
  ],
  exports: [],
})
export class AppModule {}
