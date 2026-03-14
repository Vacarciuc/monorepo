import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import qs from 'qs';

import { AppEnv } from '@/common/types/app-env.types';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { UserModule } from '@/user/user.module';

@Module({
   imports: [
      HttpModule.registerAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService<AppEnv>) => ({
            paramsSerializer: (obj) => qs.stringify(obj),
            baseURL: `${config.get('ACCOUNT_SERVICE_URL')}/api/v1/auth/`,
            headers: {
               'X-API-KEY': config.get('ACCOUNT_SERVICE_API_KEY'),
            },
         }),
      }),
      forwardRef(() => UserModule),
   ],
   providers: [AuthService, AuthGuard],
   controllers: [AuthController],
   exports: [AuthGuard, AuthService],
})
export class AuthModule {}
