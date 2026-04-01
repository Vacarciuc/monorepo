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
import { RabbitMQProducer } from '../../messaging/rabbitmq.producer';

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
    private readonly rabbitMQProducer: RabbitMQProducer,
  ) {}

  async processOrder(event: OrderCreatedEvent): Promise<SellerOrder> {
    this.logger.log(`Procesare comandă ${event.orderId}`);
    const sellerOrder = this.sellerOrderRepository.create({
      orderId: event.orderId,
      status: OrderStatus.PENDING,
      orderItems: event.items,
    });
    const saved = await this.sellerOrderRepository.save(sellerOrder);
    this.logger.log(`Comanda ${event.orderId} salvată ca PENDING cu ${event.items.length} produs(e)`);
    return saved;
  }

  async findAllOrders(): Promise<SellerOrder[]> {
    return this.sellerOrderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOrderById(id: string): Promise<SellerOrder> {
    const order = await this.sellerOrderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Comanda cu id ${id} nu a fost găsită`);
    return order;
  }

  async confirmOrder(id: string): Promise<SellerOrder> {
    const order = await this.findOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Comanda ${id} este deja ${order.status} și nu poate fi confirmată`);
    }

    const confirmed = await this.dataSource.transaction('SERIALIZABLE', async (em) => {
      const productIds = order.orderItems.map((i) => i.productId);
      const products = await em
        .getRepository(Product)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .whereInIds(productIds)
        .getMany();

      for (const item of order.orderItems) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new NotFoundException(`Produsul ${item.productId} nu a fost găsit`);
        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Stoc insuficient pentru "${product.name}": solicitat ${item.quantity}, disponibil ${product.quantity}`,
          );
        }
      }

      for (const item of order.orderItems) {
        const product = products.find((p) => p.id === item.productId)!;
        product.quantity -= item.quantity;
        await em.getRepository(Product).save(product);
        this.logger.log(`Stoc actualizat: "${product.name}" ${product.quantity + item.quantity} → ${product.quantity}`);
      }

      order.status = OrderStatus.CONFIRMED;
      order.processedAt = new Date();
      return em.getRepository(SellerOrder).save(order);
    });

    this.logger.log(`Comanda ${order.orderId} confirmată`);

    // ACK mesaj RabbitMQ
    await this.rabbitMQConsumer.acknowledgeOrder(order.orderId);

    // Publică OrderProcessed → order-service actualizează statusul comenzii
    await this.rabbitMQProducer.publishOrderProcessed({
      orderId: order.orderId,
      status: OrderStatus.CONFIRMED,
    });

    return confirmed;
  }

  async rejectOrder(id: string): Promise<SellerOrder> {
    const order = await this.findOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Comanda ${id} este deja ${order.status} și nu poate fi respinsă`);
    }

    order.status = OrderStatus.REJECTED;
    order.processedAt = new Date();
    await this.sellerOrderRepository.save(order);

    this.logger.log(`Comanda ${order.orderId} respinsă`);

    // NACK mesaj RabbitMQ
    await this.rabbitMQConsumer.rejectOrder(order.orderId);

    // Publică OrderProcessed → order-service actualizează statusul comenzii
    await this.rabbitMQProducer.publishOrderProcessed({
      orderId: order.orderId,
      status: OrderStatus.REJECTED,
    });

    return order;
  }
}
