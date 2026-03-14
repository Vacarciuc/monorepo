import { Injectable, Logger, OnModuleInit, OnModuleDestroy, forwardRef, Inject } from '@nestjs/common';
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

  // Store messages waiting for manual confirmation
  private pendingMessages = new Map<string, { msg: ConsumeMessage; channel: ConfirmChannel }>();

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
      this.logger.log(`Connecting to RabbitMQ at ${this.config.url}`);

      this.connection = amqp.connect([this.config.url]);

      this.connection.on('connect', () => {
        this.logger.log('✅ Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('❌ Disconnected from RabbitMQ', err);
      });

      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await this.setupChannel(channel);
        },
      });

      await this.startConsuming();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async setupChannel(channel: ConfirmChannel): Promise<void> {
    this.logger.log(`Setting up channel with exchange: ${this.config.exchange}`);

    // Declare exchange
    await channel.assertExchange(this.config.exchange, 'topic', {
      durable: true,
    });

    // Declare queue
    await channel.assertQueue(this.config.queue, {
      durable: true,
    });

    // Bind queue to exchange
    await channel.bindQueue(
      this.config.queue,
      this.config.exchange,
      this.config.routingKey,
    );

    this.logger.log(
      `Queue ${this.config.queue} bound to exchange ${this.config.exchange} with routing key ${this.config.routingKey}`,
    );
  }

  private async startConsuming(): Promise<void> {
    await this.channelWrapper.addSetup((channel: ConfirmChannel) => {
      return channel.consume(
        this.config.queue,
        async (msg: ConsumeMessage | null) => {
          if (msg) {
            await this.handleMessage(msg, channel);
          }
        },
        { noAck: false },
      );
    });

    this.logger.log(`Started consuming messages from ${this.config.queue}`);
  }

  private async handleMessage(
    msg: ConsumeMessage,
    channel: ConfirmChannel,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      this.logger.log(`Received message: ${content}`);

      const eventData = JSON.parse(content);
      const event = plainToInstance(OrderCreatedEvent, eventData);

      // Validate event
      const errors = await validate(event);
      if (errors.length > 0) {
        this.logger.error('Invalid event data', errors);
        channel.nack(msg, false, false); // Don't requeue invalid messages
        return;
      }

      // Process the order (save as PENDING)
      await this.sellerService.processOrder(event);

      // Store message for later acknowledgment (when manually confirmed)
      this.pendingMessages.set(event.orderId, { msg, channel });
      this.logger.log(`Message stored for order ${event.orderId}, waiting for manual confirmation`);
    } catch (error) {
      this.logger.error('Error handling message', error);
      channel.nack(msg, false, true); // Requeue on error
    }
  }

  // Method to acknowledge message when order is confirmed
  async acknowledgeOrder(orderId: string): Promise<void> {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.ack(pending.msg);
      this.pendingMessages.delete(orderId);
      this.logger.log(`✅ Message acknowledged for order ${orderId}`);
    } else {
      this.logger.warn(`No pending message found for order ${orderId}`);
    }
  }

  // Method to reject message when order is rejected
  async rejectOrder(orderId: string): Promise<void> {
    const pending = this.pendingMessages.get(orderId);
    if (pending) {
      pending.channel.nack(pending.msg, false, false); // Don't requeue
      this.pendingMessages.delete(orderId);
      this.logger.log(`❌ Message rejected for order ${orderId}`);
    } else {
      this.logger.warn(`No pending message found for order ${orderId}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }
}

