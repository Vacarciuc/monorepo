import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm'

import dataSourceConfig from '@/config/data-source.config'

export const TYPEORM_CONFIG: TypeOrmModuleAsyncOptions = {
  useFactory: dataSourceConfig,
}
