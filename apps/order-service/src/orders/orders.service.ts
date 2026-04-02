import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'

import { CartItem } from '../entities/cart-item.entity'
import { OrderItem } from '../entities/order-item.entity'
import { Order, OrderStatus } from '../entities/order.entity'
import { OutboxEvent, OutboxEventType } from '../entities/outbox-event.entity'
import { OrderProcessedEvent } from '../events/order.events'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { SellerClientService } from '../seller/seller-client.service'

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private rabbitMQService: RabbitMQService,
    private dataSource: DataSource,
    private sellerClientService: SellerClientService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.consumeOrderProcessed(
      this.handleOrderProcessed.bind(this),
    )
  }

  async createOrderFromCart(userId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const cartItemRepo = queryRunner.manager.getRepository(CartItem)
      const orderRepo = queryRunner.manager.getRepository(Order)
      const orderItemRepo = queryRunner.manager.getRepository(OrderItem)
      const outboxRepo = queryRunner.manager.getRepository(OutboxEvent)

      const cartItems = await cartItemRepo.find({
        where: { user_id: userId },
      })

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty')
      }

      let totalPrice = 0
      const orderItems: OrderItem[] = []
      let sellerId: string | null = null

      for (const cartItem of cartItems) {
        // Fetch product from seller-service
        const product = await this.sellerClientService.getProduct(cartItem.product_id)

        if (!sellerId) {
          sellerId = product.sellerId
        } else if (sellerId !== product.sellerId) {
          throw new BadRequestException(
            'All products must be from the same seller',
          )
        }

        if (product.quantity < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          )
        }

        const itemPrice = Number(product.price) * cartItem.quantity
        totalPrice += itemPrice

        const orderItem = orderItemRepo.create({
          product_id: product.id,
          quantity: cartItem.quantity,
          price: Number(product.price),
        })
        orderItems.push(orderItem)
      }

      const order = orderRepo.create({
        user_id: userId,
        seller_id: sellerId!,
        total_price: totalPrice,
        status: OrderStatus.PENDING,
        items: orderItems,
      })

      const savedOrder = await orderRepo.save(order)

      await cartItemRepo.delete({ user_id: userId })

      const eventPayload = {
        orderId: savedOrder.id,
        sellerId: sellerId!,
        items: orderItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice: totalPrice,
      }

      const routingKey = `order.created.${sellerId!}`
      await outboxRepo.save(
        outboxRepo.create({
          type: OutboxEventType.ORDER_CREATED,
          routing_key: routingKey,
          payload: eventPayload,
          published_at: null,
        }),
      )

      await queryRunner.commitTransaction()
      return savedOrder
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async findAll(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { user_id: userId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    })
  }

  async findOne(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId },
      relations: ['items'],
    })

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`)
    }

    return order
  }

  private async handleOrderProcessed(event: OrderProcessedEvent) {
    console.log('Processing OrderProcessedEvent:', event)

    const order = await this.orderRepository.findOne({
      where: { id: event.orderId },
    })

    if (!order) {
      console.error(`Order ${event.orderId} not found`)
      return
    }

    order.status = event.status as OrderStatus
    await this.orderRepository.save(order)

    console.log(`Order ${event.orderId} status updated to ${event.status}`)
  }
}
