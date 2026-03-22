import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SellerOrder, OrderStatus } from '../../database/entities/seller-order.entity';
import { Product } from '../../database/entities/product.entity';
import { OrderCreatedEvent } from '../../dto/order-created.event';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    @InjectRepository(SellerOrder)
    private readonly sellerOrderRepository: Repository<SellerOrder>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => RabbitMQConsumer))
    private readonly rabbitMQConsumer: RabbitMQConsumer,
  ) {}

  async processOrder(event: OrderCreatedEvent): Promise<SellerOrder> {
    this.logger.log(`Processing order ${event.orderId}`);

    const sellerOrder = this.sellerOrderRepository.create({
      orderId: event.orderId,
      status: OrderStatus.PENDING,
      orderItems: event.items, // snapshot items for later use at confirm time
    });

    const saved = await this.sellerOrderRepository.save(sellerOrder);
    this.logger.log(
      `Order ${event.orderId} saved as PENDING with ${event.items.length} item(s)`,
    );
    return saved;
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

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order ${id} is already ${order.status} and cannot be confirmed`,
      );
    }

    // Run everything inside a SERIALIZABLE transaction so no concurrent
    // session can read or write the same product rows until we commit.
    const confirmed = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (em) => {
        // --- 1. Lock all affected product rows (SELECT … FOR UPDATE) ---
        const productIds = order.orderItems.map((i) => i.productId);

        const products = await em
          .getRepository(Product)
          .createQueryBuilder('p')
          .setLock('pessimistic_write') // SELECT … FOR UPDATE
          .whereInIds(productIds)
          .getMany();

        // --- 2. Validate stock for every item ---
        for (const item of order.orderItems) {
          const product = products.find((p) => p.id === item.productId);

          if (!product) {
            throw new NotFoundException(
              `Product ${item.productId} not found – cannot confirm order`,
            );
          }

          if (product.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product "${product.name}": ` +
                `requested ${item.quantity}, available ${product.quantity}`,
            );
          }
        }

        // --- 3. Decrement stock for each item ---
        for (const item of order.orderItems) {
          const product = products.find((p) => p.id === item.productId)!;
          product.quantity -= item.quantity;
          await em.getRepository(Product).save(product);
          this.logger.log(
            `Stock updated: product "${product.name}" ` +
              `${product.quantity + item.quantity} → ${product.quantity}`,
          );
        }

        // --- 4. Mark order as CONFIRMED ---
        order.status = OrderStatus.CONFIRMED;
        order.processedAt = new Date();
        return em.getRepository(SellerOrder).save(order);
      },
    );

    this.logger.log(`Order ${order.orderId} confirmed and stock decremented`);

    // Acknowledge the RabbitMQ message (remove from queue)
    await this.rabbitMQConsumer.acknowledgeOrder(order.orderId);

    return confirmed;
  }

  async rejectOrder(id: string): Promise<SellerOrder> {
    const order = await this.findOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order ${id} is already ${order.status} and cannot be rejected`,
      );
    }

    order.status = OrderStatus.REJECTED;
    order.processedAt = new Date();
    await this.sellerOrderRepository.save(order);

    this.logger.log(`Order ${order.orderId} rejected`);

    // NACK the RabbitMQ message (remove from queue without requeue)
    await this.rabbitMQConsumer.rejectOrder(order.orderId);

    return order;
  }
}
