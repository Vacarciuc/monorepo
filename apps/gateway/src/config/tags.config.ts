import { DocumentBuilder } from '@nestjs/swagger'

export const enum AppTag {
  Auth = 'Auth',
  Health = 'Health',
}

export const APP_TAGS: Array<Parameters<DocumentBuilder['addTag']>> = [
  [AppTag.Auth, 'Authentication/Authorization'],
  [AppTag.Health, 'Health check related'],
]
