import { AppEnv } from '@/common/types/app-env.types';

declare global {
   namespace NodeJS {
      interface ProcessEnv extends AppEnv {}
   }
}
