import { EntityManager, Repository, IsNull } from 'typeorm';
import { RolePageRight } from '../entities/role-page-right.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';

@Injectable()
export class RolePageRightRepository extends BaseRepository<RolePageRight> {
  constructor(
    @InjectRepository(RolePageRight)
    repository: Repository<RolePageRight>,
  ) {
    super(RolePageRight, repository);
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
    const result = await this.findOne(
      {
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
      },
      manager,
    );
    return !!result;
  }

  async findGrantedPermissionsForUser(
    userId: string,
    tenantId: string | null,
    manager?: EntityManager,
  ): Promise<RolePageRight[]> {
    return this.find(
      {
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
      },
      manager,
    );
  }
}
