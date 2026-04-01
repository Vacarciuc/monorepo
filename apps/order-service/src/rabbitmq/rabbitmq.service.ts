import * as amqp from 'amqp-connection-manager'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChannelWrapper } from 'amqp-connection-manager'
import { ConfirmChannel } from 'amqplib'

const EXCHANGE = 'order.exchange'
const STATUS_QUEUE = 'order.status.queue'
const STATUS_ROUTING_KEY = 'order.processed'

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name)
  private connection: amqp.AmqpConnectionManager
  /** Canal dedicat publicării mesajelor (outbox → seller) */
  private publishChannel: ChannelWrapper
  /** Canal dedicat consumului mesajelor (seller → order-service) */
  private consumeChannel: ChannelWrapper | null = null

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('RABBITMQ_HOST', 'localhost')
    const port = this.configService.get<string>('RABBITMQ_PORT', '5672')
    const user = this.configService.get<string>('RABBITMQ_USER', 'guest')
    const pass = this.configService.get<string>('RABBITMQ_PASS', 'guest')
    const rabbitMQUrl =
      this.configService.get<string>('RABBITMQ_URL') ||
      `amqp://${user}:${pass}@${host}:${port}`

    this.connection = amqp.connect([rabbitMQUrl])

    // Canal de publish: declară doar exchange-ul
    this.publishChannel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
        this.logger.log('Publish channel ready')
      },
    })
  }

  /** Publică evenimentul OrderCreated pe exchange → seller-service */
  async publishOrderCreated(sellerId: string, orderData: any): Promise<void> {
    const routingKey = `order.created.${sellerId}`
    await this.publishChannel.publish(EXCHANGE, routingKey, orderData, {})
    this.logger.log(`Published order.created for seller ${sellerId}`)
  }

  /**
   * Înregistrează callback-ul pentru OrderProcessed și creează canalul de consum.
   * Tot setup-ul (assertExchange, assertQueue, bindQueue, consume) are loc
   * într-o SINGURĂ funcție setup → nu există race condition.
   */
  async consumeOrderProcessed(
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    this.consumeChannel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        // Declară exchange + coadă + binding + subscribe — totul atomic pe același channel
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
        await channel.assertQueue(STATUS_QUEUE, { durable: true })
        await channel.bindQueue(STATUS_QUEUE, EXCHANGE, STATUS_ROUTING_KEY)
        await channel.consume(STATUS_QUEUE, async (msg) => {
          if (!msg) return
          try {
            const content = JSON.parse(msg.content.toString())
            await callback(content)
            channel.ack(msg)
          } catch (err) {
            this.logger.error('Error processing OrderProcessed message', err)
            channel.nack(msg, false, false) // DLQ / discard
          }
        })
        this.logger.log(`Consuming from ${STATUS_QUEUE}`)
      },
    })
  }

  async onModuleDestroy() {
    await this.publishChannel.close()
    if (this.consumeChannel) await this.consumeChannel.close()
    await this.connection.close()
    this.logger.log('RabbitMQ connections closed')
  }
}
