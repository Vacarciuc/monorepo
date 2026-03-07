import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable, tap } from 'rxjs'

import { AppEnv } from '@/types/app-env.types'

// HTTP requests logging with duration
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  constructor(private readonly config: ConfigService<AppEnv>) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // Suppress for production because console is slow
    if (this.config.get('NODE_ENV') === 'production') {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const { method, url } = request

    const start = process.hrtime.bigint()

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Number(process.hrtime.bigint() - start) / 1_000_000
          this.logger.log(`HTTP ${method} ${url} took ${duration.toFixed(2)}ms`)
        },
        error: (err) => {
          const duration = Number(process.hrtime.bigint() - start) / 1_000_000
          this.logger.error(
            `HTTP ${method} ${url} failed after ${duration.toFixed(2)}ms: ${err.message}`,
          )
        },
      }),
    )
  }
}
