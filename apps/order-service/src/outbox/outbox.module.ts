import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { OutboxPublisher } from './outbox.publisher';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent]), RabbitMQModule],
  providers: [OutboxPublisher],
})
export class OutboxModule {}

