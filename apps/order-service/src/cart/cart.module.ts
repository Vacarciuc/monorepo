import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CartItem } from '../entities/cart-item.entity'
import { ProductsModule } from '../products/products.module'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
