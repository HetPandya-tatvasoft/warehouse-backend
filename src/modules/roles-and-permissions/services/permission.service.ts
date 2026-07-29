import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePageRightRepository } from '../repositories/role-page-right.repository';
import { Page, Permission } from '../enums/permissions.enum';
import { Page as PageEntity } from '../entities/page.entity';
import { Permission as PermissionEntity } from '../entities/permission.entity';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';

@Injectable()
export class PermissionService {
  constructor(
    private readonly rolePageRightRepository: RolePageRightRepository,
    @InjectRepository(PageEntity)
    private readonly pageRepository: Repository<PageEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  // if the authenticated user has active access credentials to a page.
  async hasPermission(currentUser: ICurrentUserData, page: Page, permission: Permission): Promise<boolean> {
    if (!currentUser || !currentUser.userId) {
      return false;
    }

    return this.rolePageRightRepository.checkPermission(currentUser.userId, currentUser.tenantId, page, permission);
  }

  async getEffectivePermissions(currentUser: ICurrentUserData): Promise<Record<string, Record<string, boolean>>> {
    if (!currentUser || !currentUser.userId) {
      return {};
    }

    const [pages, permissions] = await Promise.all([
      this.pageRepository.find({ where: { isDeleted: false } }),
      this.permissionRepository.find({ where: { isDeleted: false } }),
    ]);

    const permissionsMap: Record<string, Record<string, boolean>> = {};
    for (const page of pages) {
      permissionsMap[page.name] = {};
      for (const perm of permissions) {
        permissionsMap[page.name][perm.name] = false;
      }
    }

    // user's granted permissions
    const granted = await this.rolePageRightRepository.findGrantedPermissionsForUser(
      currentUser.userId,
      currentUser.tenantId,
    );

    //Populate base mapping with granted permissions
    for (const rpr of granted) {
      const pageName = rpr.pageAccess?.page?.name;
      const permissionName = rpr.pageAccess?.accessType?.name;
      if (pageName && permissionName && permissionsMap[pageName]) {
        permissionsMap[pageName][permissionName] = true;
      }
    }

    return permissionsMap;
  }
}
