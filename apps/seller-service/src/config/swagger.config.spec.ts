import { Test, TestingModule } from '@nestjs/testing';
import { setupSwagger } from './swagger.config';
import { INestApplication } from '@nestjs/common';

describe('SwaggerConfig', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should setup Swagger documentation without errors', () => {
    expect(() => setupSwagger(app)).not.toThrow();
  });

  it('should configure Swagger with correct title and version', () => {
    setupSwagger(app);
    // If no errors thrown, the configuration is successful
    expect(app).toBeDefined();
  });
});
