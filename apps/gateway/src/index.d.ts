import type { AppEnv } from "@/types/app-env.types";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AppEnv {}
  }

  type TypeRef<T> = T; // Same as typeorm Relation type
}
