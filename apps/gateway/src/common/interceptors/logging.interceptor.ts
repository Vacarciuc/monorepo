import {
   CallHandler,
   ExecutionContext,
   Injectable,
   Logger,
   NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
   private readonly logger = new Logger(LoggingInterceptor.name);

   intercept(
      context: ExecutionContext,
      next: CallHandler<any>,
   ): Observable<any> | Promise<Observable<any>> {
      const startTime = Date.now();
      const request = context.switchToHttp().getRequest();
      const { method, url } = request;

      return next.handle().pipe(
         tap(() => {
            const endTime = Date.now();
            this.logger.log(
               `HTTP ${method} ${url} took ${endTime - startTime}ms`,
            );
         }),
      );
   }
}
