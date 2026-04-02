import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { SellerClientService } from './seller-client.service'

@Module({
  imports: [HttpModule],
  providers: [SellerClientService],
  exports: [SellerClientService],
})
export class SellerClientModule {}

