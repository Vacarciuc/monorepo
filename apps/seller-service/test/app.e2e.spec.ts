import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SellerModule } from '../src/modules/seller/seller.module';
import { SellerService } from '../src/modules/seller/seller.service';
import { RabbitMQProducer } from '../src/messaging/rabbitmq.producer';
import { SellerOrder, OrderStatus } from '../src/database/entities/seller-order.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderCreatedEvent } from '../src/dto/order-created.event';

describe('Seller Service E2E', () => {
  let app: INestApplication;
  let sellerService: SellerService;
  let repository: Repository<SellerOrder>;
  let producer: RabbitMQProducer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: process.env.TEST_DB_NAME || 'seller_test_db',
          entities: [SellerOrder],
          synchronize: true,
          dropSchema: true,
        }),
        SellerModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sellerService = moduleFixture.get<SellerService>(SellerService);
    repository = moduleFixture.get<Repository<SellerOrder>>(
      getRepositoryToken(SellerOrder),
    );
    producer = moduleFixture.get<RabbitMQProducer>(RabbitMQProducer);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await repository.clear();
  });

  describe('Order Processing Flow', () => {
    it('should process order from PENDING to CONFIRMED', async () => {
      // Mock the producer to avoid actual RabbitMQ connection
      jest.spyOn(producer, 'publishOrderProcessed').mockResolvedValue(undefined);

      const orderCreatedEvent: OrderCreatedEvent = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        sellerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174002',
            quantity: 2,
            price: 50,
          },
        ],
        totalPrice: 100,
      };

      // Process the order
      const result = await sellerService.processOrder(orderCreatedEvent);

      // Verify the order was created with CONFIRMED status
      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderCreatedEvent.orderId);
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.processedAt).toBeDefined();

      // Verify the order exists in database
      const savedOrder = await repository.findOne({
        where: { orderId: orderCreatedEvent.orderId },
      });

      expect(savedOrder).toBeDefined();
      expect(savedOrder?.status).toBe(OrderStatus.CONFIRMED);

      // Verify event was published
      expect(producer.publishOrderProcessed).toHaveBeenCalledWith({
        orderId: orderCreatedEvent.orderId,
        status: OrderStatus.CONFIRMED,
      });
    });

    it('should process multiple orders independently', async () => {
      jest.spyOn(producer, 'publishOrderProcessed').mockResolvedValue(undefined);

      const event1: OrderCreatedEvent = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        sellerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [],
        totalPrice: 100,
      };

      const event2: OrderCreatedEvent = {
        orderId: '123e4567-e89b-12d3-a456-426614174003',
        sellerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [],
        totalPrice: 200,
      };

      // Process both orders
      await Promise.all([
        sellerService.processOrder(event1),
        sellerService.processOrder(event2),
      ]);

      // Verify both orders exist
      const orders = await repository.find();
      expect(orders).toHaveLength(2);
      expect(orders.every((o) => o.status === OrderStatus.CONFIRMED)).toBe(true);
    });
  });

  describe('Manual Order Operations', () => {
    it('should manually confirm a pending order', async () => {
      jest.spyOn(producer, 'publishOrderProcessed').mockResolvedValue(undefined);

      // Create a pending order
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.PENDING,
      });
      const savedOrder = await repository.save(order);

      // Manually confirm
      const result = await sellerService.confirmOrder(savedOrder.id);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.processedAt).toBeDefined();
      expect(producer.publishOrderProcessed).toHaveBeenCalled();
    });

    it('should manually reject a pending order', async () => {
      jest.spyOn(producer, 'publishOrderProcessed').mockResolvedValue(undefined);

      // Create a pending order
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.PENDING,
      });
      const savedOrder = await repository.save(order);

      // Manually reject
      const result = await sellerService.rejectOrder(savedOrder.id);

      expect(result.status).toBe(OrderStatus.REJECTED);
      expect(result.processedAt).toBeDefined();
      expect(producer.publishOrderProcessed).toHaveBeenCalled();
    });
  });

  describe('Query Operations', () => {
    it('should retrieve all orders', async () => {
      // Create multiple orders
      const orders = [
        repository.create({
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          status: OrderStatus.CONFIRMED,
          processedAt: new Date(),
        }),
        repository.create({
          orderId: '123e4567-e89b-12d3-a456-426614174001',
          status: OrderStatus.PENDING,
        }),
        repository.create({
          orderId: '123e4567-e89b-12d3-a456-426614174002',
          status: OrderStatus.REJECTED,
          processedAt: new Date(),
        }),
      ];

      await repository.save(orders);

      const result = await sellerService.findAllOrders();

      expect(result).toHaveLength(3);
    });

    it('should retrieve order by id', async () => {
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      });

      const savedOrder = await repository.save(order);

      const result = await sellerService.findOrderById(savedOrder.id);

      expect(result.id).toBe(savedOrder.id);
      expect(result.orderId).toBe(savedOrder.orderId);
    });
  });
});


