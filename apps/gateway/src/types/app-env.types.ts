export type NodeEnv = 'development' | 'production'

export interface AppEnv {
  NODE_ENV: NodeEnv

  PORT: string
  HOST: string

  CORS_ORIGIN: string
  CORS_HEADERS: string
  CORS_METHODS: string

  AUTH_SERVICE_URL: string
  ORDER_SERVICE_URL: string
  SELLER_SERVICE_URL: string
}
