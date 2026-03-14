import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import qs from 'qs';

import { AppEnv } from '@/common/types/app-env.types';
import { AuthModule } from '@/auth/auth.module';
import { UserController } from '@/user/user.controller';
import { UserService } from '@/user/user.service';

@Module({
   imports: [
      HttpModule.registerAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService<AppEnv>) => ({
            paramsSerializer: (obj) => qs.stringify(obj),
            baseURL: `${config.get('ACCOUNT_SERVICE_URL')}/api/v1/user/`,
            headers: {
               'X-API-KEY': config.get('ACCOUNT_SERVICE_API_KEY'),
            },
         }),
      }),
      forwardRef(() => AuthModule),
   ],
   providers: [UserService],
   controllers: [UserController],
   exports: [UserService],
})
export class UserModule {}
