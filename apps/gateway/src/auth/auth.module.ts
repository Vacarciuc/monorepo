import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import qs from 'qs'

import { AuthController } from '@/auth/auth.controller'
import { AuthGuard } from '@/auth/auth.guard'
import { AuthService } from '@/auth/auth.service'
import { AppEnv } from '@/types/app-env.types'

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv>) => ({
        paramsSerializer: (obj) => qs.stringify(obj),
        baseURL: `${config.get('AUTH_SERVICE_URL')}/api/v1/auth/`,
        headers: {},
      }),
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
