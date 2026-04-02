import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { Product } from '../../database/entities/product.entity';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';
import { RabbitMQProducer } from '../../messaging/rabbitmq.producer';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [SellerController],
  providers: [SellerService, RabbitMQConsumer, RabbitMQProducer],
  exports: [SellerService],
})
export class SellerModule {}
