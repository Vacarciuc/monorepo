import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { HealthModule } from '@/health/health.module';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';
import { ENV_CONFIG } from '@/config/env.config';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { GLOBAL_VALIDATION_PIPE_CONFIG } from '@/config/global-validation-pipe.config';

@Module({
   imports: [
      ConfigModule.forRoot(ENV_CONFIG),
      HealthModule,
      AuthModule,
      UserModule,
   ],
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
