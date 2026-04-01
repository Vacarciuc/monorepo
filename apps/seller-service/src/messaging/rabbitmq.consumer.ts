import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
  Inject,
} from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { getRabbitMQConfig } from '../config/rabbitmq.config';
import { SellerService } from '../modules/seller/seller.service';
import { OrderCreatedEvent } from '../dto/order-created.event';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly config = getRabbitMQConfig();

  // Mesaje care așteaptă confirmare manuală
  private pendingMessages = new Map<
    string,
    { msg: ConsumeMessage; channel: ConfirmChannel }
  >();

  constructor(
    @Inject(forwardRef(() => SellerService))
    private readonly sellerService: SellerService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.logger.log(`Conectare la RabbitMQ: ${this.config.url}`);
      this.connection = amqp.connect([this.config.url]);

      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: ConfirmChannel) => {
          this.logger.log(`Configurare canal și coadă: ${this.config.queue}`);

          // 1. Assert exchange
          await channel.assertExchange(this.config.exchange, 'topic', {
            durable: true,
          });

          // 2. Assert coadă consumer
          await channel.assertQueue(this.config.queue, { durable: true });

          // 3. Bind cu consumerRoutingKey (ex: order.created.*)
          await channel.bindQueue(
            this.config.queue,
            this.config.exchange,
            this.config.consumerRoutingKey,
          );

          // 4. Start consuming
          await channel.consume(
            this.config.queue,
            async (msg: ConsumeMessage | null) => {
              if (msg) {
                await this.handleMessage(msg, channel);
              }
            },
            { noAck: false },
          );

          this.logger.log(
            `✅ Coada ${this.config.queue} legată cu routing key "${this.config.consumerRoutingKey}" și consumă mesaje.`,
          );
        },
      });
    } catch (error) {
      this.logger.error('Eroare la conectarea la RabbitMQ', error);
      throw error;
    }
  }

  private async handleMessage(
    msg: ConsumeMessage,
    channel: ConfirmChannel,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      this.logger.log(`Mesaj primit: ${content}`);

      const eventData = JSON.parse(content);
      const event = plainToInstance(OrderCreatedEvent, eventData);

      const errors = await validate(event);
      if (errors.length > 0) {
        this.logger.error('Date eveniment invalide', errors);
        channel.nack(msg, false, false);
        return;
      }

      // Salvează comanda ca PENDING
      await this.sellerService.processOrder(event);

      // Stochează mesajul pentru confirmare ulterioară
      this.pendingMessages.set(event.orderId, { msg, channel });
      this.logger.log(
        `Mesaj stocat pentru comanda ${event.orderId}, așteptare confirmare manuală`,
      );
    } catch (error) {
      this.logger.error('Eroare la procesarea mesajului', error);
      channel.nack(msg, false, true);
    }
  }

  /** ACK mesaj — apelat după confirmare */
  async acknowledgeOrder(orderId: string): Promise<void> {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.ack(pending.msg);
      this.pendingMessages.delete(orderId);
      this.logger.log(`✅ Mesaj ACK pentru comanda ${orderId}`);
    } else {
      this.logger.warn(`Niciun mesaj pending pentru comanda ${orderId}`);
    }
  }

  /** NACK mesaj — apelat după respingere */
  async rejectOrder(orderId: string): Promise<void> {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.nack(pending.msg, false, false);
      this.pendingMessages.delete(orderId);
      this.logger.log(`❌ Mesaj NACK pentru comanda ${orderId}`);
    } else {
      this.logger.warn(`Niciun mesaj pending pentru comanda ${orderId}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Deconectat de la RabbitMQ (consumer)');
    } catch (error) {
      this.logger.error('Eroare la deconectare RabbitMQ', error);
    }
  }
}
