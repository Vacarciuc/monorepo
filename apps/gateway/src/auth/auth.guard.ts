import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthService } from "@/auth/auth.service";
import { AppRequest } from "@/types/app-request.types";
import { IS_PUBLIC_DECORATOR_KEY } from "@/auth/auth.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest<AppRequest>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_DECORATOR_KEY,
        [context.getHandler(), context.getClass()],
      )
      if (isPublic) {
        return true
      }

      throw new UnauthorizedException('no token provided')
    }

    const decodedJwt = await this.authService.validate(token)
    if (!decodedJwt) {
      throw new UnauthorizedException('token validation failed')
    }
    request.user = decodedJwt

    return true
  }

  private extractTokenFromHeader(request: AppRequest): string | null {
    const [type, token] = request.header('Authorization')?.split(' ') ?? []
    return type === 'Bearer' ? token : null
  }
}
