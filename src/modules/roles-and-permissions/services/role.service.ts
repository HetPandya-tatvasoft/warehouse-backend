import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { RolePaginationQueryDto } from '../dto/role-pagination.dto';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { Role } from '../entities/role.entity';
import { RoleUpsertDto } from '../dto/role-upsert.dto';
import { DataSource, In, Repository } from 'typeorm';
import { RolePageRightRepository } from '../repositories/role-page-right.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from '../entities/page.entity';
import { PageAccess } from '../entities/page-access.entity';
import { UpdateRolePageRightsDto } from '../dto/update-role-page-rights.dto';
import { PlatformRoleCodes } from '@/common/enums/role.enum';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly rolePageRightRepository: RolePageRightRepository,
    private readonly dataSource: DataSource,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(PageAccess)
    private readonly pageAccessRepository: Repository<PageAccess>,
  ) {}

  async createRole(roleDto: RoleUpsertDto, user: ICurrentUserData): Promise<Role> {
    const existingRole = await this.roleRepository.findByName(roleDto.name, user.tenantId);
    if (existingRole) {
      throw new ConflictException(MESSAGES.ROLE.NAME_EXISTS);
    }

    const roleInstance = this.roleRepository.create({
      name: roleDto.name,
      tenantId: user.tenantId,
      description: roleDto.description,
    });
    return this.roleRepository.save(roleInstance);
  }

  async getRolesPaginated(
    user: ICurrentUserData,
    paginationRequest: RolePaginationQueryDto,
  ): Promise<IPaginatedResponse<Role>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search } = paginationRequest;

    return this.roleRepository.findPaginated(user.tenantId, page, pageSize, sortBy, sortOrder, search);
  }

  async getRoleById(id: string, user: ICurrentUserData): Promise<Role> {
    const role = await this.roleRepository.findById(id, user.tenantId);
    if (!role) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }
    return role;
  }

  async updateRole(id: string, roleDto: RoleUpsertDto, user: ICurrentUserData): Promise<Role> {
    const existingRole = await this.getRoleById(id, user);

    // also one thign - prevent renaming of platform roles

    if (roleDto.name && roleDto.name !== existingRole.name) {
      const duplicateRole = await this.roleRepository.findByName(roleDto.name, user.tenantId);
      if (duplicateRole) {
        throw new ConflictException(MESSAGES.ROLE.NAME_EXISTS);
      }
    }

    const updatedRole = await this.roleRepository.updateRole(
      id,
      {
        name: roleDto.name,
        description: roleDto.description,
      },
      user.tenantId,
    );

    if (!updatedRole) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }

    return updatedRole;
  }

  async deleteRole(id: string, user: ICurrentUserData): Promise<void> {
    const role = await this.getRoleById(id, user);
    if (
      role.name === (PlatformRoleCodes.TENANT_ADMIN as string) ||
      // Cleanup this code after as I have removed this role globally
      role.name === (PlatformRoleCodes.PLATFORM_SUPER_ADMIN as string)
    ) {
      throw new BadRequestException(MESSAGES.ROLE.SYSTEM_ROLES_NO_DELETE);
    }
    const deleted = await this.roleRepository.deleteRole(id, user.tenantId);
    if (!deleted) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }
  }

  async getPageRights(roleId: string, user: ICurrentUserData) {
    const role = await this.roleRepository.findById(roleId, user.tenantId);
    if (!role) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }

    const pages = await this.pageRepository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    const pageAccesses = await this.pageAccessRepository.find({
      where: {
        page: { isDeleted: false },
        accessType: { isDeleted: false },
      },
      relations: { page: true, accessType: true },
    });

    const currentRights = await this.rolePageRightRepository.find({
      where: { roleId },
    });

    const grantedAccessIds = new Set(currentRights.map((r) => r.pageAccessId));

    const pageAccessesMap = new Map<string, PageAccess[]>();
    for (const pa of pageAccesses) {
      if (!pageAccessesMap.has(pa.pageId)) {
        pageAccessesMap.set(pa.pageId, []);
      }
      pageAccessesMap.get(pa.pageId)!.push(pa);
    }

    const order: Record<string, number> = { VIEW: 1, CREATE: 2, UPDATE: 3, DELETE: 4 };

    const pagesMatrix = pages.map((page) => {
      const accesses = pageAccessesMap.get(page.id) || [];
      const permissionsList = accesses.map((pa) => ({
        permissionId: pa.accessTypeId,
        permissionName: pa.accessType.name,
        pageAccessId: pa.id,
        granted: grantedAccessIds.has(pa.id),
      }));

      permissionsList.sort((a, b) => {
        const orderA = order[a.permissionName] ?? 99;
        const orderB = order[b.permissionName] ?? 99;
        return orderA - orderB;
      });

      return {
        pageId: page.id,
        pageName: page.name,
        permissions: permissionsList,
      };
    });

    return {
      roleId: role.id,
      roleName: role.name,
      pages: pagesMatrix,
    };
  }

  async updatePageRights(roleId: string, dto: UpdateRolePageRightsDto, user: ICurrentUserData): Promise<void> {
    const role = await this.roleRepository.findById(roleId, user.tenantId);
    if (!role) {
      throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND);
    }

    const { pageAccessIds } = dto;
    const uniquePageAccessIds = Array.from(new Set(pageAccessIds));

    if (uniquePageAccessIds.length > 0) {
      const count = await this.pageAccessRepository.count({
        where: {
          id: In(uniquePageAccessIds),
          page: { isDeleted: false },
          accessType: { isDeleted: false },
        },
      });
      if (count !== uniquePageAccessIds.length) {
        throw new BadRequestException(MESSAGES.ROLE.PAGE_ACCESS_INVALID);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await this.rolePageRightRepository.delete({ roleId }, manager);
      await this.rolePageRightRepository.bulkInsert(roleId, uniquePageAccessIds, manager);
    });
  }
}
