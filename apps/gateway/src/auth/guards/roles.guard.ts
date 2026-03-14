import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
   ROLE_METADATA_KEY,
   RoleHierarchy,
} from '@/auth/decorators/roles.decroator';
import { UserRole } from '@/user/enums/user-role.enum';
import { DecodedJwt } from '@/auth/types/decoded-jwt.types';

@Injectable()
export class RolesGuard implements CanActivate {
   constructor(private readonly reflector: Reflector) {}

   canActivate(context: ExecutionContext): boolean {
      const requiredRole = this.reflector.getAllAndOverride<UserRole>(
         ROLE_METADATA_KEY,
         [context.getHandler(), context.getClass()],
      );

      if (!requiredRole) {
         return true;
      }

      const { role }: DecodedJwt = context.switchToHttp().getRequest().user;
      const roleIndex = RoleHierarchy.indexOf(role);
      const requiredRoleIndex = RoleHierarchy.indexOf(requiredRole);
      return roleIndex >= requiredRoleIndex;
   }
}
