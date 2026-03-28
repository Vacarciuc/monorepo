import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Seller Service API')
    .setDescription(
      'Microservice for processing orders from RabbitMQ queue. ' +
        'Automatically processes orders and publishes results back to the message broker.',
    )
    .setVersion('1.0.0')
    .addTag('seller-orders', 'Order processing and management operations')
    .addServer('http://localhost:3002', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Seller Service API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}
