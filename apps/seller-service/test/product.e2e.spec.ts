import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

describe('Product E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdProductId: string;

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

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query('DELETE FROM products');
    }
    await app.close();
  });

  describe('POST /products - Create Product', () => {
    it('should create a product with image', async () => {
      const testImagePath = path.join(__dirname, '../test-assets/test-image.png');

      // Create a dummy image if it doesn't exist
      if (!fs.existsSync(path.dirname(testImagePath))) {
        fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
      }
      if (!fs.existsSync(testImagePath)) {
        // Create a minimal PNG file (1x1 pixel transparent)
        const buffer = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
          0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
          0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
          0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
          0x42, 0x60, 0x82,
        ]);
        fs.writeFileSync(testImagePath, buffer);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .field('name', 'Test Laptop')
        .field('description', 'High-performance laptop')
        .field('price', '1299.99')
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Laptop');
      expect(response.body.price).toBe('1299.99');
      expect(response.body.imagePath).toMatch(/\/uploads\/products\/.+\.png$/);

      createdProductId = response.body.id;
    });

    it('should create a product without image', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Test Product Without Image',
          description: 'Simple product',
          price: 99.99,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Product Without Image');
    });

    it('should fail with invalid price', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Invalid Product',
          price: -10,
        })
        .expect(400);
    });
  });

  describe('GET /products - Get All Products', () => {
    it('should return all products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /products/:id - Get Product by ID', () => {
    it('should return a product by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .expect(200);

      expect(response.body.id).toBe(createdProductId);
      expect(response.body.name).toBe('Test Laptop');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/products/invalid-uuid')
        .expect(400);
    });
  });

  describe('PUT /products/:id - Update Product', () => {
    it('should update a product', async () => {
      const response = await request(app.getHttpServer())
        .put(`/products/${createdProductId}`)
        .send({
          name: 'Updated Laptop',
          price: 1499.99,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Laptop');
      expect(response.body.price).toBe('1499.99');
    });
  });

  describe('DELETE /products/:id - Delete Product', () => {
    it('should delete a product', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .expect(204);

      // Verify product is deleted
      await request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .expect(404);
    });
  });
});

