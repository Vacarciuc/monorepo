import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { RabbitMQConsumer, PendingOrder } from '../../messaging/rabbitmq.consumer';
import { RabbitMQProducer } from '../../messaging/rabbitmq.producer';
import { OrderStatus } from '../../database/entities/seller-order.entity';

export interface OrderActionResult {
  orderId: string;
  status: 'CONFIRMED' | 'REJECTED';
}

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly rabbitMQConsumer: RabbitMQConsumer,
    private readonly rabbitMQProducer: RabbitMQProducer,
  ) {}

  // ── Citire din coadă (fără DB) ───────────────────────────────────────────

  /** Returnează comenzile pendinte direct din memoria consumerului */
  getPendingOrders(): PendingOrder[] {
    return this.rabbitMQConsumer.getPendingOrders();
  }

  /** Returnează o singură comandă pendintă după orderId */
  getOrderById(orderId: string): PendingOrder {
    const pending = this.rabbitMQConsumer.getPendingOrder(orderId);
    if (!pending) {
      throw new NotFoundException(`Comanda ${orderId} nu se află în coada de așteptare`);
    }
    return pending;
  }

  // ── Produse (rămân în DB) ────────────────────────────────────────────────

  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Produsul cu id ${id} nu a fost găsit`);
    return product;
  }

  // ── Acțiuni seller (ACK/NACK + publish) ─────────────────────────────────

  /**
   * Seller confirmă comanda:
   * 1. Scade stocul produselor (tranzacție DB)
   * 2. ACK mesaj RabbitMQ (șters din coadă)
   * 3. Publică `order.processed` cu status CONFIRMED → order-service actualizează
   */
  async confirmOrder(orderId: string): Promise<OrderActionResult> {
    const pending = this.rabbitMQConsumer.getPendingOrder(orderId);
    if (!pending) {
      throw new NotFoundException(
        `Comanda ${orderId} nu se află în coada de așteptare`,
      );
    }

    const { items } = pending.event;

    // Scade stocul produselor în tranzacție
    await this.dataSource.transaction('SERIALIZABLE', async (em) => {
      const productIds = items.map((i) => i.productId);
      const products = await em
        .getRepository(Product)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .whereInIds(productIds)
        .getMany();

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product)
          throw new NotFoundException(`Produsul ${item.productId} nu a fost găsit`);
        if (product.quantity < item.quantity)
          throw new Error(
            `Stoc insuficient pentru "${product.name}": solicitat ${item.quantity}, disponibil ${product.quantity}`,
          );
        product.quantity -= item.quantity;
        await em.getRepository(Product).save(product);
        this.logger.log(`Stoc actualizat: "${product.name}" → ${product.quantity}`);
      }
    });

    // ACK — mesajul este șters din coadă
    this.rabbitMQConsumer.acknowledgeOrder(orderId);

    // Publică răspunsul înapoi → order-service schimbă statusul
    await this.rabbitMQProducer.publishOrderProcessed({ orderId, status: OrderStatus.CONFIRMED });

    this.logger.log(`✅ Comanda ${orderId} confirmată și ACK-ată`);
    return { orderId, status: 'CONFIRMED' };
  }

  /**
   * Seller respinge comanda:
   * 1. NACK mesaj RabbitMQ (șters din coadă fără requeue)
   * 2. Publică `order.processed` cu status REJECTED → order-service actualizează
   */
  async rejectOrder(orderId: string): Promise<OrderActionResult> {
    const pending = this.rabbitMQConsumer.getPendingOrder(orderId);
    if (!pending) {
      throw new NotFoundException(
        `Comanda ${orderId} nu se află în coada de așteptare`,
      );
    }

    // NACK fără requeue — mesajul este eliminat din coadă
    this.rabbitMQConsumer.rejectOrder(orderId);

    // Publică răspunsul înapoi
    await this.rabbitMQProducer.publishOrderProcessed({ orderId, status: OrderStatus.REJECTED });

    this.logger.log(`❌ Comanda ${orderId} respinsă și NACK-ată`);
    return { orderId, status: 'REJECTED' };
  }
}
