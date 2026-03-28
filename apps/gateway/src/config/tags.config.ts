import { DocumentBuilder } from '@nestjs/swagger'

export const enum AppTag {
  Auth = 'Auth',
  Health = 'Health',
  Order = 'Order',
  Seller = 'Seller'
}

export const APP_TAGS: Array<Parameters<DocumentBuilder['addTag']>> = [
  [AppTag.Auth, 'Authentication/Authorization'],
  [AppTag.Health, 'Health check related'],
  [AppTag.Order, 'Order service'],
  [AppTag.Seller, 'Seller service'],
]
