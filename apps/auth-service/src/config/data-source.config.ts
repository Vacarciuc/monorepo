import { DataSourceOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

import { User } from '@/entities/user.entity'

export const DATA_SOURCE_ENTITIES = [User]

export default (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: DATA_SOURCE_ENTITIES,
  // Maybe in future decouple auto migrations run and setup manually
  synchronize: true,
  logger: 'advanced-console',
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
  migrations: ['dist/migrations/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
})
