import {
   CanActivate,
   ExecutionContext,
   Injectable,
   UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';

import { AuthService } from '@/auth/auth.service';
import { IS_PUBLIC_DECORATOR_KEY } from '@/auth/decorators/auth.decorator';
import { AuthCookie } from '@/auth/enums/auth-cookie.enum';
import { AppRequest } from '@/common/types/app-request.types';

@Injectable()
export class AuthGuard implements CanActivate {
   constructor(
      private readonly authService: AuthService,
      private readonly reflector: Reflector,
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest<AppRequest>();
      const response = httpContext.getResponse<Response>();
      const token = request.cookies[AuthCookie.AccessToken];

      if (!token) {
         const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_DECORATOR_KEY,
            [context.getHandler(), context.getClass()],
         );
         if (isPublic) {
            return true;
         }

         throw new UnauthorizedException();
      }

      const result = await this.authService.validate(token);

      // Get rid of token if expired or other mismatches
      if (!result.valid) {
         response.clearCookie(AuthCookie.AccessToken, { httpOnly: true });
         throw new UnauthorizedException(result.error);
      }

      request.user = result.decoded;

      return true;
   }
}
