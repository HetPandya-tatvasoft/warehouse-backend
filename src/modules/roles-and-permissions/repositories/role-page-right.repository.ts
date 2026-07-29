import { EntityManager, Repository, IsNull } from 'typeorm';
import { RolePageRight } from '../entities/role-page-right.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolePageRightRepository {
  constructor(
    @InjectRepository(RolePageRight)
    private readonly repository: Repository<RolePageRight>,
  ) {}

  async findByRoleId(roleId: string, manager?: EntityManager): Promise<RolePageRight[]> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    return repository.find({
      where: { roleId },
    });
  }

  async deleteByRoleId(roleId: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    await repository.delete({ roleId });
  }

  async bulkInsert(roleId: string, pageAccessIds: string[], manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;

    const mappings = pageAccessIds.map((pageAccessId) => ({
      roleId,
      pageAccessId,
    }));

    if (mappings.length > 0) {
      await repository.insert(mappings);
    }
  }

  async checkPermission(
    userId: string,
    tenantId: string | null,
    pageName: string,
    accessTypeName: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    const result = await repository.findOne({
      where: {
        role: {
          isDeleted: false,
          tenantId: tenantId ?? IsNull(),
          userRoles: {
            userId,
            user: {
              isActive: true,
            },
          },
        },
        pageAccess: {
          page: {
            name: pageName,
            isDeleted: false,
          },
          accessType: {
            name: accessTypeName,
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
      },
    });
    return !!result;
  }

  async findGrantedPermissionsForUser(
    userId: string,
    tenantId: string | null,
    manager?: EntityManager,
  ): Promise<RolePageRight[]> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    return repository.find({
      where: {
        role: {
          isDeleted: false,
          tenantId: tenantId ?? IsNull(),
          userRoles: {
            userId,
            user: {
              isActive: true,
            },
          },
        },
        pageAccess: {
          page: {
            isDeleted: false,
          },
          accessType: {
            isDeleted: false,
          },
        },
      },
      relations: {
        pageAccess: {
          page: true,
          accessType: true,
        },
      },
      select: {
        id: true,
        pageAccess: {
          id: true,
          page: {
            id: true,
            name: true,
          },
          accessType: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
