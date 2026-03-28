import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'

import { OutboxEvent, OutboxEventType } from '../entities/outbox-event.entity'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null
  private isFlushing = false

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  onModuleInit() {
    // Simple in-process poller (good for dev/MVP). For production, run as a separate worker.
    this.timer = setInterval(() => void this.flush(), 1000)
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  private async flush() {
    if (this.isFlushing) return
    this.isFlushing = true
    try {
      const pending = await this.outboxRepository.find({
        where: { published_at: IsNull() },
        order: { created_at: 'ASC' },
        take: 50,
      })

      for (const event of pending) {
        await this.publish(event)
        event.published_at = new Date()
        await this.outboxRepository.save(event)
      }
    } finally {
      this.isFlushing = false
    }
  }

  private async publish(event: OutboxEvent) {
    switch (event.type) {
      case OutboxEventType.ORDER_CREATED: {
        const sellerId = event.payload?.sellerId
        if (typeof sellerId !== 'string' || sellerId.length === 0) return
        await this.rabbitMQService.publishOrderCreated(sellerId, event.payload)
        return
      }
      default:
        return
    }
  }
}
