import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { COOKIE_NAMES } from '@/common/constants/cookie.constants';

export const ActiveBranchId = createParamDecorator((_: undefined, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const activeBranchId = request.cookies?.[COOKIE_NAMES.ACTIVE_BRANCH_ID] as string | undefined;
  if (!activeBranchId) {
    throw new BadRequestException('No active branch selected.');
  }
  return activeBranchId;
});
