export type NodeEnv = 'development' | 'production'

export interface AppEnv {
  NODE_ENV: NodeEnv

  PORT: string
  HOST: string

  DB_NAME: string
  DB_PORT: string
  DB_USER: string
  DB_HOST: string
  DB_PASSWORD: string

  CORS_ORIGIN: string
  CORS_HEADERS: string
  CORS_METHODS: string

  JWT_SECRET: string
  JWT_TTL: string
  JWT_AUD: string
}
