import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayloadDto } from '../dtos/jwt-payload.dto';
import { Roles, ServiceType } from '../constants/enum';
import { SetMetadata } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './auth.guard';

export const ROLE_KEY = 'role';
export const SERVICE_TYPE_KEY = 'serviceType';

export const Role = (...role: Roles[]) => SetMetadata(ROLE_KEY, role);
export const ServiceTypeGuard = (...serviceTypes: ServiceType[]) => SetMetadata(SERVICE_TYPE_KEY, serviceTypes);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Controllers can apply this guard at class level while exposing public
    // authentication endpoints.  Honour @Public() here as well as in AuthGuard.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.get<Roles[]>(ROLE_KEY, context.getHandler()) || [];
    const requiredServiceTypes = this.reflector.get<ServiceType[]>(SERVICE_TYPE_KEY, context.getHandler()) || [];

    const request = context.switchToHttp().getRequest();
    const user: JwtPayloadDto = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied. Please log in again.');
    }

    const hasRole = requiredRoles.length === 0 || requiredRoles.includes(user.role);
    const hasServiceType = requiredServiceTypes.length === 0 || requiredServiceTypes.includes(user.serviceType);

    if (!hasRole || !hasServiceType) {
      throw new ForbiddenException('Access denied due to insufficient role or service type');
    }

    return true; 
  }
}
