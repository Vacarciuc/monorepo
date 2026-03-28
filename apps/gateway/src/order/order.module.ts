import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import qs from 'qs'

import { AuthModule } from '@/auth/auth.module'
import { OrderController } from '@/order/order.controller'
import { OrderService } from '@/order/order.service'
import { AppEnv } from '@/types/app-env.types'

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv>) => ({
        paramsSerializer: (obj) => qs.stringify(obj),
        baseURL: `${config.get('ORDER_SERVICE_URL')}/`,
        headers: {},
      }),
    }),
    AuthModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
