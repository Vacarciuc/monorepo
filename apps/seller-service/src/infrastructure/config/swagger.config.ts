import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Seller Service API')
    .setDescription('Microservice for managing sellers, products, and carts with RabbitMQ integration')
    .setVersion('1.0')
    .addTag('sellers', 'Seller management endpoints')
    .addTag('products', 'Product management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

