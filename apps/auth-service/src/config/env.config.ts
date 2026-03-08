import { ConfigModuleOptions } from '@nestjs/config'

import dataSourceConfig from '@/config/data-source.config'

export const ENV_CONFIG: ConfigModuleOptions = {
  cache: true,
  isGlobal: true,
  envFilePath: ['.env.local', '.env', '.env.development', '.env.production'],
  load: [dataSourceConfig],
  expandVariables: true,
  validatePredefined: true,
  ignoreEnvFile: process.env.NODE_ENV === 'production',
}
