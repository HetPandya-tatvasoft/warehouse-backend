import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { COOKIE_NAMES } from '@/common/constants/cookie.constants';
import type { Request } from 'express';

export const RefreshToken = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return request.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string;
});
