import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { getRabbitMQConfig } from '../config/rabbitmq.config';
import { OrderCreatedEvent } from '../dto/order-created.event';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export interface PendingOrder {
  event: OrderCreatedEvent;
  receivedAt: Date;
}

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly config = getRabbitMQConfig();

  /**
   * Mesaje așteptând acțiune manuală a vânzătorului.
   * Cheia = orderId (din payload), valoarea = mesajul brut + canalul + event-ul parsat.
   * NU se face ACK până când seller-ul nu confirmă/respinge prin endpoint.
   */
  private pendingMessages = new Map<string, {
    msg: ConsumeMessage;
    channel: ConfirmChannel;
    order: PendingOrder;
  }>();

  constructor() {}

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
          await channel.assertExchange(this.config.exchange, 'topic', { durable: true });
          await channel.assertQueue(this.config.queue, { durable: true });
          await channel.bindQueue(this.config.queue, this.config.exchange, this.config.consumerRoutingKey);

          // prefetch(1) — nu prelua al doilea mesaj până nu se ACK-ează primul
          await channel.prefetch(1);

          await channel.consume(
            this.config.queue,
            async (msg: ConsumeMessage | null) => {
              if (msg) await this.handleMessage(msg, channel);
            },
            { noAck: false },
          );

          this.logger.log(
            `✅ Consumând din "${this.config.queue}" (routing: "${this.config.consumerRoutingKey}") — așteptare acțiune manuală`,
          );
        },
      });
    } catch (error) {
      this.logger.error('Eroare la conectarea la RabbitMQ', error);
      throw error;
    }
  }

  private async handleMessage(msg: ConsumeMessage, channel: ConfirmChannel): Promise<void> {
    try {
      const content = msg.content.toString();
      this.logger.log(`📨 Mesaj primit: ${content}`);

      const eventData = JSON.parse(content);
      const event = plainToInstance(OrderCreatedEvent, eventData);

      const errors = await validate(event);
      if (errors.length > 0) {
        this.logger.error('Date eveniment invalide', errors);
        channel.nack(msg, false, false); // mesaj malformat → discard
        return;
      }

      // Stochează fără ACK — mesajul rămâne "unacknowledged" în broker
      // până când seller-ul apelează /confirm sau /reject
      this.pendingMessages.set(event.orderId, {
        msg,
        channel,
        order: { event, receivedAt: new Date() },
      });

      this.logger.log(
        `📦 Comanda ${event.orderId} ținută în memorie — așteptare acțiune seller (${this.pendingMessages.size} pending)`,
      );
    } catch (error) {
      this.logger.error('Eroare la procesarea mesajului', error);
      channel.nack(msg, false, true); // requeue
    }
  }

  // ── Metode expuse către SellerService ──────────────────────────────────────

  /** Returnează toate comenzile pendinte din memorie */
  getPendingOrders(): PendingOrder[] {
    return Array.from(this.pendingMessages.values()).map((p) => p.order);
  }

  /** Returnează o singură comandă pendintă după orderId */
  getPendingOrder(orderId: string): PendingOrder | undefined {
    return this.pendingMessages.get(orderId)?.order;
  }

  /** ACK — apelat după confirmare de seller */
  acknowledgeOrder(orderId: string): void {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.ack(pending.msg);
      this.pendingMessages.delete(orderId);
      this.logger.log(`✅ ACK comanda ${orderId} (${this.pendingMessages.size} pending)`);
    } else {
      this.logger.warn(`Niciun mesaj pending pentru comanda ${orderId}`);
    }
  }

  /** NACK fără requeue — apelat după respingere de seller */
  rejectOrder(orderId: string): void {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.nack(pending.msg, false, false);
      this.pendingMessages.delete(orderId);
      this.logger.log(`❌ NACK comanda ${orderId} (${this.pendingMessages.size} pending)`);
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
