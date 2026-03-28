import * as amqp from 'amqp-connection-manager'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChannelWrapper } from 'amqp-connection-manager'
import { ConfirmChannel } from 'amqplib'

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.AmqpConnectionManager
  private channelWrapper: ChannelWrapper

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rabbitMQUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    )

    this.connection = amqp.connect([rabbitMQUrl])

    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange('order.exchange', 'topic', {
          durable: true,
        })

        await channel.assertQueue('order.status.queue', { durable: true })
        await channel.bindQueue(
          'order.status.queue',
          'order.exchange',
          'order.processed',
        )
      },
    })

    console.log('RabbitMQ connection established')
  }

  async publishOrderCreated(sellerId: string, orderData: any) {
    const routingKey = `order.created.${sellerId}`
    await this.channelWrapper.publish(
      'order.exchange',
      routingKey,
      orderData,
      {},
    )
    console.log(`Published OrderCreated event for seller ${sellerId}`)
  }

  async consumeOrderProcessed(callback: (message: any) => Promise<void>) {
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.consume('order.status.queue', async (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString())
          await callback(content)
          channel.ack(msg)
        }
      })
    })
  }

  async onModuleDestroy() {
    await this.channelWrapper.close()
    await this.connection.close()
    console.log('RabbitMQ connection closed')
  }
}
