export type NodeEnv = 'development' | 'production'

export interface AppEnv {
  NODE_ENV: NodeEnv

  PORT: string
  HOST: string

  CORS_ORIGIN: string
  CORS_HEADERS: string
  CORS_METHODS: string

  // Auth service
  AUTH_SERVICE_HOST: string
  AUTH_SERVICE_PORT: string
  AUTH_SERVICE_URL: string

  // Order service
  ORDER_SERVICE_HOST: string
  ORDER_SERVICE_PORT: string
  ORDER_SERVICE_URL: string

  // Seller service
  SELLER_SERVICE_HOST: string
  SELLER_SERVICE_PORT: string
  SELLER_SERVICE_URL: string
}
