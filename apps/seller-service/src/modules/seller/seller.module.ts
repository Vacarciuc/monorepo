import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { SellerOrder } from '../../database/entities/seller-order.entity';
import { Product } from '../../database/entities/product.entity';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([SellerOrder, Product])],
  controllers: [SellerController],
  providers: [SellerService, RabbitMQConsumer],
  exports: [SellerService],
})
export class SellerModule {}
