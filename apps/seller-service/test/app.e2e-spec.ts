import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Seller, Product, Cart } from '../src/domain/entities';
import { Repository } from 'typeorm';
describe('Seller Service E2E Tests', () => {
  let app: INestApplication;
  let sellerRepository: Repository<Seller>;
  let productRepository: Repository<Product>;
  let cartRepository: Repository<Cart>;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    sellerRepository = moduleFixture.get(getRepositoryToken(Seller));
    productRepository = moduleFixture.get(getRepositoryToken(Product));
    cartRepository = moduleFixture.get(getRepositoryToken(Cart));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    // Clean up database before each test
    await cartRepository.delete({});
    await productRepository.delete({});
    await sellerRepository.delete({});
  });
  describe('Sellers (e2e)', () => {
    it('/sellers (POST) - should create a new seller', () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        phone: '+1234567890',
      };
      return request(app.getHttpServer())
        .post('/sellers')
        .send(dto)
        .expect(201)
        .then((response) => {
          expect(response.body).toMatchObject({
            name: dto.name,
            email: dto.email,
            companyName: dto.companyName,
            phone: dto.phone,
            status: 'active',
          });
          expect(response.body.id).toBeDefined();
          expect(response.body.createdAt).toBeDefined();
        });
    });
    it('/sellers (GET) - should return all sellers', async () => {
      await request(app.getHttpServer())
        .post('/sellers')
        .send({
          name: 'Seller 1',
          email: 'seller1@example.com',
          companyName: 'Company 1',
        });
      await request(app.getHttpServer())
        .post('/sellers')
        .send({
          name: 'Seller 2',
          email: 'seller2@example.com',
          companyName: 'Company 2',
        });
      return request(app.getHttpServer())
        .get('/sellers')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveLength(2);
        });
    });
    it('/sellers/:id (GET) - should return a seller by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/sellers')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          companyName: 'Acme Inc.',
        });
      const sellerId = createResponse.body.id;
      return request(app.getHttpServer())
        .get(`/sellers/\${sellerId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toEqual(sellerId);
          expect(response.body.name).toEqual('John Doe');
        });
    });
  });
  describe('Products (e2e)', () => {
    let sellerId: string;
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/sellers')
        .send({
          name: 'Test Seller',
          email: 'test@example.com',
          companyName: 'Test Inc.',
        });
      sellerId = response.body.id;
    });
    it('/products (POST) - should create a new product', () => {
      const dto = {
        sellerId,
        name: 'Laptop',
        description: 'Gaming laptop',
        price: 1299.99,
        stock: 10,
        currency: 'USD',
      };
      return request(app.getHttpServer())
        .post('/products')
        .send(dto)
        .expect(201)
        .then((response) => {
          expect(response.body).toMatchObject({
            sellerId,
            name: dto.name,
            description: dto.description,
            price: dto.price,
            stock: dto.stock,
            currency: dto.currency,
          });
          expect(response.body.id).toBeDefined();
        });
    });
  });
  describe('Cart (e2e)', () => {
    let sellerId: string;
    let productId: string;
    beforeEach(async () => {
      const sellerResponse = await request(app.getHttpServer())
        .post('/sellers')
        .send({
          name: 'Test Seller',
          email: 'test@example.com',
          companyName: 'Test Inc.',
        });
      sellerId = sellerResponse.body.id;
      const productResponse = await request(app.getHttpServer())
        .post('/products')
        .send({ sellerId, name: 'Laptop', price: 1200, stock: 10 });
      productId = productResponse.body.id;
    });
    it('/sellers/:id/cart (GET) - should return seller cart', () => {
      return request(app.getHttpServer())
        .get(`/sellers/\${sellerId}/cart`)
        .expect(200)
        .then((response) => {
          expect(response.body.sellerId).toEqual(sellerId);
          expect(response.body.items).toEqual([]);
        });
    });
    it('/sellers/:id/cart/items (POST) - should add item to cart', () => {
      return request(app.getHttpServer())
        .post(`/sellers/\${sellerId}/cart/items`)
        .send({ productId, quantity: 2 })
        .expect(201)
        .then((response) => {
          expect(response.body.items).toHaveLength(1);
          expect(response.body.items[0]).toMatchObject({
            productId,
            quantity: 2,
          });
        });
    });
  });
});
