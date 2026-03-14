import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { getRabbitMQConfig } from '../config/rabbitmq.config';
import { OrderProcessedEvent } from '../dto/order-processed.event';

@Injectable()
export class RabbitMQProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProducer.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly config = getRabbitMQConfig();

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = amqp.connect([this.config.url]);

      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.assertExchange(this.config.exchange, 'topic', {
            durable: true,
          });
        },
      });

      this.logger.log('Producer connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect producer to RabbitMQ', error);
      throw error;
    }
  }

  async publishOrderProcessed(event: OrderProcessedEvent): Promise<void> {
    try {
      await this.channelWrapper.publish(
        this.config.exchange,
        this.config.routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );

      this.logger.log(
        `Published OrderProcessed event for order ${event.orderId} with status ${event.status}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish OrderProcessed event', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Producer disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting producer from RabbitMQ', error);
    }
  }
}

