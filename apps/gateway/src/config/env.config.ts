import { ConfigModuleOptions } from "@nestjs/config";

export const ENV_CONFIG: ConfigModuleOptions = {
  cache: true,
  isGlobal: true,
  envFilePath: [".env.local", ".env", ".env.development", ".env.production"],
  load: [],
  expandVariables: true,
  validatePredefined: true,
  ignoreEnvFile: process.env.NODE_ENV === "production",
};
