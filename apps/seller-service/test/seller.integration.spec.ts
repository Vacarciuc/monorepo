import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerModule } from '../src/modules/seller/seller.module';
import { SellerOrder, OrderStatus } from '../src/database/entities/seller-order.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('SellerController (Integration)', () => {
  let app: INestApplication;
  let repository: Repository<SellerOrder>;

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
          dropSchema: true, // Clean database for each test run
        }),
        SellerModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    repository = moduleFixture.get<Repository<SellerOrder>>(
      getRepositoryToken(SellerOrder),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up database after each test
    await repository.clear();
  });

  describe('GET /seller/orders', () => {
    it('should return empty array when no orders exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/seller/orders')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all orders', async () => {
      // Create test orders
      const order1 = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      });

      const order2 = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174001',
        status: OrderStatus.PENDING,
      });

      await repository.save([order1, order2]);

      const response = await request(app.getHttpServer())
        .get('/seller/orders')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('orderId');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /seller/orders/:id', () => {
    it('should return a specific order', async () => {
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      });

      const savedOrder = await repository.save(order);

      const response = await request(app.getHttpServer())
        .get(`/seller/orders/${savedOrder.id}`)
        .expect(200);

      expect(response.body.id).toBe(savedOrder.id);
      expect(response.body.orderId).toBe(savedOrder.orderId);
      expect(response.body.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/seller/orders/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/seller/orders/invalid-uuid')
        .expect(400);
    });
  });

  describe('POST /seller/orders/:id/confirm', () => {
    it('should confirm a pending order', async () => {
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.PENDING,
      });

      const savedOrder = await repository.save(order);

      const response = await request(app.getHttpServer())
        .post(`/seller/orders/${savedOrder.id}/confirm`)
        .expect(201);

      expect(response.body.status).toBe(OrderStatus.CONFIRMED);
      expect(response.body.processedAt).toBeDefined();

      // Verify in database
      const updatedOrder = await repository.findOne({
        where: { id: savedOrder.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/seller/orders/123e4567-e89b-12d3-a456-426614174999/confirm')
        .expect(404);
    });
  });

  describe('POST /seller/orders/:id/reject', () => {
    it('should reject a pending order', async () => {
      const order = repository.create({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.PENDING,
      });

      const savedOrder = await repository.save(order);

      const response = await request(app.getHttpServer())
        .post(`/seller/orders/${savedOrder.id}/reject`)
        .expect(201);

      expect(response.body.status).toBe(OrderStatus.REJECTED);
      expect(response.body.processedAt).toBeDefined();

      // Verify in database
      const updatedOrder = await repository.findOne({
        where: { id: savedOrder.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.REJECTED);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/seller/orders/123e4567-e89b-12d3-a456-426614174999/reject')
        .expect(404);
    });
  });
});

