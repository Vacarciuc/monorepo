import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppEnv } from '@/common/types/app-env.types';
import { AppModule } from '@/app.module';
import { urlencoded } from 'express';
import multer from 'multer';

async function bootstrap() {
   const logger = new Logger(bootstrap.name, { timestamp: true });
   const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger,
   });
   const config = app.get(ConfigService<AppEnv>);
   const httpPort = config.get('HTTP_PORT');
   const httpHost = config.get('HTTP_HOST');

   app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
      // methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE']
   });
   app.setGlobalPrefix('/api');
   app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
   });
   app.set('query parser', 'extended');
   app.use(cookieParser());

   const swaggerConfig = new DocumentBuilder()
      .setTitle('CarHive Gateway')
      .setVersion('1.0.0')
      .build();

   const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup('/docs', app, swaggerDocument, {
      jsonDocumentUrl: '/docs/swagger.json',
      customSiteTitle: 'Gateway docs',
      useGlobalPrefix: true,
   });

   await app.listen(httpPort, httpHost, () =>
      logger.log(`HTTP listening to ${httpHost}:${httpPort}`),
   );
}

bootstrap();
