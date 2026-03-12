import { Logger, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { IncomingMessage, Server, ServerResponse } from 'http'

import { AppModule } from '@/app.module'
import { APP_TAGS } from '@/config/tags.config'
import { AppEnv } from '@/types/app-env.types'

// HTTP server type
export type AppServer = Server<typeof IncomingMessage, typeof ServerResponse>

// Nest Express wrapper
export type AppType = NestExpressApplication<AppServer>

class App {
  private nestApp: AppType
  private logger: Logger
  private config: ConfigService<AppEnv>
  private port: string
  private host: string

  constructor() {}

  async launch() {
    await this.init()
    this.setupInternalConfig()
    this.setupDocs()
    await this.listen()
  }

  private async init() {
    this.logger = new Logger(App.name, { timestamp: true })
    this.nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: this.logger,
    })
    this.config = this.nestApp.get(ConfigService<AppEnv>)
    this.port = this.config.get('PORT')!
    this.host = this.config.get('HOST')!
  }

  private setupInternalConfig() {
    this.nestApp.use(
      helmet({
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        hsts: false,
        contentSecurityPolicy: false,
        // @ts-ignore
        'upgrade-insecure-requests': null,
      }),
    )
    this.nestApp.enableCors({
      origin: this.config.get('CORS_ORIGIN')!.split(','),
      allowedHeaders: this.config.get('CORS_HEADERS')!.split(','),
      methods: this.config.get('CORS_METHODS')!.split(','),
      credentials: true,
    })
    this.nestApp.setGlobalPrefix('/api')
    this.nestApp.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    })
    this.nestApp.set('query parser', 'extended') // qs
    this.nestApp.use(cookieParser())
  }

  private setupDocs() {
    let swaggerConfig = new DocumentBuilder()
      .setTitle('Auth microservice')
      .setVersion('0.0.1')
      .addBearerAuth()

    APP_TAGS.forEach((tag) => {
      swaggerConfig = swaggerConfig.addTag(...tag)
    })

    const swaggerDocument = SwaggerModule.createDocument(
      this.nestApp,
      swaggerConfig.build(),
    )

    SwaggerModule.setup('/docs', this.nestApp, swaggerDocument, {
      jsonDocumentUrl: '/docs/swagger.json',
      customSiteTitle: 'Auth microservice docs',
      useGlobalPrefix: true,
    })
  }

  private async listen() {
    const server: AppServer = await this.nestApp.listen(
      this.port,
      this.host,
      () => {
        this.logger.log(`HTTP listening to ${this.host}:${this.port}`)
      },
    )
  }
}

const app = new App()
app.launch()
