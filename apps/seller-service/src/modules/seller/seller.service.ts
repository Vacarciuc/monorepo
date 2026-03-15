import { Injectable, Logger, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerOrder, OrderStatus } from '../../database/entities/seller-order.entity';
import { OrderCreatedEvent } from '../../dto/order-created.event';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    @InjectRepository(SellerOrder)
    private readonly sellerOrderRepository: Repository<SellerOrder>,
    @Inject(forwardRef(() => RabbitMQConsumer))
    private readonly rabbitMQConsumer: RabbitMQConsumer,
  ) {}

  async processOrder(event: OrderCreatedEvent): Promise<SellerOrder> {
    this.logger.log(`Processing order ${event.orderId}`);

    // Save order with PENDING status (waiting for manual confirmation)
    const sellerOrder = this.sellerOrderRepository.create({
      orderId: event.orderId,
      status: OrderStatus.PENDING,
    });

    await this.sellerOrderRepository.save(sellerOrder);
    this.logger.log(`Order ${event.orderId} saved with PENDING status - waiting for manual confirmation`);

    return sellerOrder;
  }

  async findAllOrders(): Promise<SellerOrder[]> {
    return this.sellerOrderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOrderById(id: string): Promise<SellerOrder> {
    const order = await this.sellerOrderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async confirmOrder(id: string): Promise<SellerOrder> {
    const order = await this.findOrderById(id);

    order.status = OrderStatus.CONFIRMED;
    order.processedAt = new Date();
    await this.sellerOrderRepository.save(order);

    this.logger.log(`Order ${order.orderId} manually confirmed`);

    // Acknowledge message in RabbitMQ (delete from queue)
    await this.rabbitMQConsumer.acknowledgeOrder(order.orderId);

    return order;
  }

  async rejectOrder(id: string): Promise<SellerOrder> {
    const order = await this.findOrderById(id);

    order.status = OrderStatus.REJECTED;
    order.processedAt = new Date();
    await this.sellerOrderRepository.save(order);

    this.logger.log(`Order ${order.orderId} manually rejected`);

    // Reject message in RabbitMQ (delete from queue without requeue)
    await this.rabbitMQConsumer.rejectOrder(order.orderId);

    return order;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

