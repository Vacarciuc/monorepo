import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
   BadRequestException,
   ConflictException,
   ForbiddenException,
   GoneException,
   ImATeapotException,
   InternalServerErrorException,
   Logger,
   MethodNotAllowedException,
   NotAcceptableException,
   NotFoundException,
   PayloadTooLargeException,
   RequestTimeoutException,
   UnauthorizedException,
   UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AxiosError, AxiosRequestConfig, isAxiosError } from 'axios';

/** Handles requests that should be forwarded to a microservice */
export abstract class BaseMicroserviceService {
   protected constructor(
      protected readonly httpService: HttpService,
      protected readonly logger: Logger,
   ) {}

   // Simulates redirecting to the microservice
   protected async forwardRequest<TResponse>(
      config: AxiosRequestConfig,
   ): Promise<TResponse> {
      try {
         const response$ = this.httpService.request<TResponse>(config);
         const response = await firstValueFrom(response$);
         return response.data;
      } catch (err) {
         if (isAxiosError(err)) {
            const axiosErr = err as AxiosError;
            const status = axiosErr.response?.status;
            const url = axiosErr.config?.url;
            const method = axiosErr.config?.method?.toUpperCase();
            const message = axiosErr.message;

            this.logger.error(
               `AxiosError ${status} on ${method} ${url}: ${message}`
            );
         } else {
            this.logger.error(`Unexpected error: ${(err as Error).message}`);
         }

         this.throwIfAxiosClientError(err);
         throw new InternalServerErrorException();
      }
   }

   // Makes a request to the microservice
   protected async request<TResponse>(
      config: AxiosRequestConfig,
   ): Promise<TResponse> {
      const response$ = this.httpService.request<TResponse>(config);
      const response = await firstValueFrom(response$);
      return response.data;
   }

   private throwIfAxiosClientError(err: unknown): void {
      if (
         isAxiosError(err) &&
         err.response &&
         err.response.status >= 400 &&
         err.response.status < 500
      ) {
         const message = err.response?.data?.message;

         switch (err.response.status) {
            case 400:
               throw new BadRequestException(message);
            case 401:
               throw new UnauthorizedException(message);
            case 403:
               throw new ForbiddenException(message);
            case 404:
               throw new NotFoundException(message);
            case 405:
               throw new MethodNotAllowedException(message);
            case 406:
               throw new NotAcceptableException(message);
            case 408:
               throw new RequestTimeoutException(message);
            case 409:
               throw new ConflictException(message);
            case 410:
               throw new GoneException(message);
            case 413:
               throw new PayloadTooLargeException(message);
            case 415:
               throw new UnsupportedMediaTypeException(message);
            case 418:
               throw new ImATeapotException(message);
         }
      }
   }
}
