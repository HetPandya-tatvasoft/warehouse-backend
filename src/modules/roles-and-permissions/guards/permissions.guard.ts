import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';
import { PERMISSIONS_KEY, PermissionMetadata } from '../decorators/permissions.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read decorator metadata from handler or class level
    const requiredPermission = this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission metadata exists, allow the request to continue
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: ICurrentUserData }>();

    // Get the authenticated user from the request
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    // checks authorization from permission service
    const hasAccess = await this.permissionService.hasPermission(
      user,
      requiredPermission.page,
      requiredPermission.permission,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
