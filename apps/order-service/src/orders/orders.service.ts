import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/order.dto';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { OrderProcessedEvent } from '../events/order.events';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productsService: ProductsService,
    private cartService: CartService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.consumeOrderProcessed(
      this.handleOrderProcessed.bind(this),
    );
  }

  async createOrderFromCart(userId: string): Promise<Order> {
    const cartItems = await this.cartService.getCart(userId);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cartItems) {
      const hasStock = await this.productsService.checkStock(
        item.product_id,
        item.quantity,
      );
      if (!hasStock) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product.name}`,
        );
      }
    }

    let totalPrice = 0;
    const orderItems: OrderItem[] = [];
    let sellerId: string | null = null;

    for (const cartItem of cartItems) {
      const product = await this.productsService.findOne(cartItem.product_id);

      if (!sellerId) {
        sellerId = product.seller_id;
      } else if (sellerId !== product.seller_id) {
        throw new BadRequestException(
          'All products must be from the same seller',
        );
      }

      await this.productsService.decreaseStock(product.id, cartItem.quantity);

      const itemPrice = product.price * cartItem.quantity;
      totalPrice += itemPrice;

      const orderItem = this.orderItemRepository.create({
        product_id: product.id,
        quantity: cartItem.quantity,
        price: product.price,
      });
      orderItems.push(orderItem);
    }

    const order = this.orderRepository.create({
      user_id: userId,
      seller_id: sellerId!,
      total_price: totalPrice,
      status: OrderStatus.PENDING,
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    await this.cartService.clearCart(userId);

    await this.rabbitMQService.publishOrderCreated(sellerId!, {
      orderId: savedOrder.id,
      sellerId: sellerId!,
      items: orderItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: totalPrice,
    });

    return savedOrder;
  }

  async findAll(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  private async handleOrderProcessed(event: OrderProcessedEvent) {
    console.log('Processing OrderProcessedEvent:', event);

    const order = await this.orderRepository.findOne({
      where: { id: event.orderId },
    });

    if (!order) {
      console.error(`Order ${event.orderId} not found`);
      return;
    }

    order.status = event.status as OrderStatus;
    await this.orderRepository.save(order);

    console.log(`Order ${event.orderId} status updated to ${event.status}`);
  }
}

