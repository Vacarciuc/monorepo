import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { BaseEvent } from './event.types';

@Injectable()
export class RabbitMQPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisher.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchange = 'seller-events';

  async onModuleInit() {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

    this.connection = amqp.connect([rabbitmqUrl]);

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.error('Disconnected from RabbitMQ', err);
    });

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchange, 'topic', { durable: true });
        this.logger.log(`Exchange ${this.exchange} asserted`);
      },
    });
  }

  async publish<T>(event: BaseEvent<T>): Promise<void> {
    try {
      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp || new Date(),
      };

      const routingKey = event.event.replace(/\./g, '.');

      await this.channelWrapper.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(eventWithTimestamp)),
        { persistent: true },
      );

      this.logger.log(`Event published: ${event.event}`, { context: event.context });
    } catch (error) {
      this.logger.error('Failed to publish event', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
    await this.connection.close();
    this.logger.log('RabbitMQ connection closed');
  }
}

