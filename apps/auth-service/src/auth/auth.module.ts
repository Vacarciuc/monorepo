import { Global, Module, forwardRef } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CryptoModule } from '@/crypto/crypto.module'
import { User } from '@/entities'

import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [forwardRef(() => CryptoModule), TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, JwtService],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
