import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/config/swagger.config';

describe('Swagger Documentation (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger Endpoints', () => {
    it('should serve Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(301); // Redirect to /api/docs/

      expect(response.headers.location).toContain('/api/docs/');
    });

    it('should serve Swagger UI HTML at /api/docs/', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200);

      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('Seller Service API');
    });

    it('should serve OpenAPI JSON specification', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect('Content-Type', /json/);

      const spec = response.body;

      // Verify basic OpenAPI structure
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Seller Service API');
      expect(spec.info.version).toBe('1.0.0');

      // Verify tags
      expect(spec.tags).toBeDefined();
      expect(spec.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'seller-orders',
            description: 'Order processing and management operations',
          }),
        ]),
      );

      // Verify paths exist
      expect(spec.paths).toBeDefined();
      expect(spec.paths['/seller/orders']).toBeDefined();
      expect(spec.paths['/seller/orders/{id}']).toBeDefined();
      expect(spec.paths['/seller/orders/{id}/confirm']).toBeDefined();
      expect(spec.paths['/seller/orders/{id}/reject']).toBeDefined();
    });
  });

  describe('OpenAPI Specification Validation', () => {
    let openApiSpec: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      openApiSpec = response.body;
    });

    it('should have GET /seller/orders endpoint documented', () => {
      const endpoint = openApiSpec.paths['/seller/orders'].get;

      expect(endpoint).toBeDefined();
      expect(endpoint.tags).toContain('seller-orders');
      expect(endpoint.summary).toBe('Get all orders');
      expect(endpoint.responses['200']).toBeDefined();
      expect(endpoint.responses['200'].description).toBe(
        'List of all orders retrieved successfully',
      );
    });

    it('should have GET /seller/orders/:id endpoint documented', () => {
      const endpoint = openApiSpec.paths['/seller/orders/{id}'].get;

      expect(endpoint).toBeDefined();
      expect(endpoint.tags).toContain('seller-orders');
      expect(endpoint.summary).toBe('Get order by ID');
      expect(endpoint.parameters).toBeDefined();
      expect(endpoint.parameters[0].name).toBe('id');
      expect(endpoint.parameters[0].in).toBe('path');
      expect(endpoint.parameters[0].required).toBe(true);
      expect(endpoint.responses['200']).toBeDefined();
      expect(endpoint.responses['400']).toBeDefined();
      expect(endpoint.responses['404']).toBeDefined();
    });

    it('should have POST /seller/orders/:id/confirm endpoint documented', () => {
      const endpoint = openApiSpec.paths['/seller/orders/{id}/confirm'].post;

      expect(endpoint).toBeDefined();
      expect(endpoint.tags).toContain('seller-orders');
      expect(endpoint.summary).toBe('Manually confirm an order');
      expect(endpoint.parameters).toBeDefined();
      expect(endpoint.parameters[0].name).toBe('id');
      expect(endpoint.responses['200']).toBeDefined();
      expect(endpoint.responses['400']).toBeDefined();
      expect(endpoint.responses['404']).toBeDefined();
    });

    it('should have POST /seller/orders/:id/reject endpoint documented', () => {
      const endpoint = openApiSpec.paths['/seller/orders/{id}/reject'].post;

      expect(endpoint).toBeDefined();
      expect(endpoint.tags).toContain('seller-orders');
      expect(endpoint.summary).toBe('Manually reject an order');
      expect(endpoint.parameters).toBeDefined();
      expect(endpoint.parameters[0].name).toBe('id');
      expect(endpoint.responses['200']).toBeDefined();
      expect(endpoint.responses['400']).toBeDefined();
      expect(endpoint.responses['404']).toBeDefined();
    });

    it('should have SellerOrder schema documented', () => {
      const schemas = openApiSpec.components?.schemas;

      expect(schemas).toBeDefined();
      expect(schemas.SellerOrder).toBeDefined();

      const schema = schemas.SellerOrder;
      expect(schema.properties).toBeDefined();
      expect(schema.properties.id).toBeDefined();
      expect(schema.properties.orderId).toBeDefined();
      expect(schema.properties.status).toBeDefined();
      expect(schema.properties.processedAt).toBeDefined();
      expect(schema.properties.createdAt).toBeDefined();

      // Verify enum for status
      expect(schema.properties.status.enum).toEqual([
        'PENDING',
        'CONFIRMED',
        'REJECTED',
      ]);
    });

    it('should have OrderCreatedEvent schema documented', () => {
      const schemas = openApiSpec.components?.schemas;

      expect(schemas).toBeDefined();
      expect(schemas.OrderCreatedEvent).toBeDefined();

      const schema = schemas.OrderCreatedEvent;
      expect(schema.properties).toBeDefined();
      expect(schema.properties.orderId).toBeDefined();
      expect(schema.properties.sellerId).toBeDefined();
      expect(schema.properties.items).toBeDefined();
      expect(schema.properties.totalPrice).toBeDefined();
    });

    it('should have OrderProcessedEvent schema documented', () => {
      const schemas = openApiSpec.components?.schemas;

      expect(schemas).toBeDefined();
      expect(schemas.OrderProcessedEvent).toBeDefined();

      const schema = schemas.OrderProcessedEvent;
      expect(schema.properties).toBeDefined();
      expect(schema.properties.orderId).toBeDefined();
      expect(schema.properties.status).toBeDefined();

      // Verify enum for status
      expect(schema.properties.status.enum).toEqual([
        'PENDING',
        'CONFIRMED',
        'REJECTED',
      ]);
    });

    it('should have all endpoints properly tagged', () => {
      const paths = openApiSpec.paths;

      Object.keys(paths).forEach((path) => {
        Object.keys(paths[path]).forEach((method) => {
          const operation = paths[path][method];
          expect(operation.tags).toBeDefined();
          expect(operation.tags.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have proper response schemas', () => {
      const getOrdersResponse =
        openApiSpec.paths['/seller/orders'].get.responses['200'];
      const getOrderByIdResponse =
        openApiSpec.paths['/seller/orders/{id}'].get.responses['200'];

      expect(getOrdersResponse.content['application/json'].schema).toBeDefined();
      expect(getOrderByIdResponse.content['application/json'].schema).toBeDefined();
    });
  });

  describe('Swagger UI Customization', () => {
    it('should have custom title in Swagger UI', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200);

      expect(response.text).toContain('Seller Service API Documentation');
    });

    it('should hide topbar in Swagger UI', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200);

      expect(response.text).toContain('.swagger-ui .topbar { display: none }');
    });
  });
});

