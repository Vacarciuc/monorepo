import { Module } from '@nestjs/common'

import { CryptoService } from './crypto.service'

@Module({
  providers: [CryptoService],
  exports: [CryptoService],
  imports: [],
  controllers: [],
})
export class CryptoModule {}
