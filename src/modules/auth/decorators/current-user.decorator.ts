import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { ICurrentUserData } from '../types/jwt-payload.interface';

interface AuthenticatedRequest {
  user: ICurrentUserData;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

  return request.user;
});
