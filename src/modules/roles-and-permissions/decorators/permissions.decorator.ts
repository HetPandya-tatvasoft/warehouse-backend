import { SetMetadata } from '@nestjs/common';
import type { Page, Permission } from '../enums/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionMetadata {
  page: Page;
  permission: Permission;
}

export const Permissions = (page: Page, permission: Permission) => SetMetadata(PERMISSIONS_KEY, { page, permission });
