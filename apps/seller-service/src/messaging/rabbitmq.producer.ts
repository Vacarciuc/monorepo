import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
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
        json: true,
        setup: async (channel: ConfirmChannel) => {
          // Producătorul are nevoie doar de exchange — order-service creează coada de răspuns
          await channel.assertExchange(this.config.exchange, 'topic', {
            durable: true,
          });
          this.logger.log(
            `Producer conectat la exchange "${this.config.exchange}", routing key de publicare: "${this.config.producerRoutingKey}"`,
          );
        },
      });
    } catch (error) {
      this.logger.error('Eroare la conectarea producătorului la RabbitMQ', error);
      throw error;
    }
  }

  /**
   * Publică un eveniment OrderProcessed (CONFIRMED sau REJECTED) pe exchange-ul
   * `order.exchange` cu routing key `order.processed`.
   * Order-service ascultă pe coada `order.status.queue` legată la acest routing key.
   */
  async publishOrderProcessed(event: OrderProcessedEvent): Promise<void> {
    try {
      await this.channelWrapper.publish(
        this.config.exchange,
        this.config.producerRoutingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );

      this.logger.log(
        `✅ Publicat OrderProcessedEvent pentru comanda ${event.orderId} cu status ${event.status}`,
      );
    } catch (error) {
      this.logger.error('Eroare la publicarea OrderProcessedEvent', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Deconectat de la RabbitMQ (producer)');
    } catch (error) {
      this.logger.error('Eroare la deconectarea producătorului', error);
    }
  }
}
