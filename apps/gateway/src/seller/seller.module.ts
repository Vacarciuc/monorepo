import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import qs from 'qs'

import { AuthModule } from '@/auth/auth.module'
import { SellerController } from '@/seller/seller.controller'
import { SellerService } from '@/seller/seller.service'
import { UploadsProxyController } from '@/seller/uploads-proxy.controller'
import { AppEnv } from '@/types/app-env.types'

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv>) => ({
        paramsSerializer: (obj) => qs.stringify(obj),
        baseURL: `${config.get('SELLER_SERVICE_URL')}/`,
        headers: {},
      }),
    }),
    AuthModule,
  ],
  providers: [SellerService],
  controllers: [SellerController, UploadsProxyController],
  exports: [SellerService],
})
export class SellerModule {}



