import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { DeepPartial, EntityManager, FindOptionsWhere, IsNull, Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { IPaginatedResponse } from '@/common/types/api-response.interface';

@Injectable()
export class RoleRepository extends BaseRepository<Role> {
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
  ) {
    super(Role, repository);
  }

  async updateRole(
    roleId: string,
    roleData: DeepPartial<Role>,
    tenantId: string | null,
    manager?: EntityManager,
  ): Promise<Role | null> {
    const result = await this.update(
      {
        id: roleId,
        tenantId: tenantId ?? IsNull(),
        isDeleted: false,
      },
      roleData,
      manager,
    );
    if ((result.affected ?? 0) === 0) {
      return null;
    }
    return this.findById(roleId, tenantId, manager);
  }

  async deleteRole(roleId: string, tenantId: string | null, manager?: EntityManager): Promise<boolean> {
    const result = await this.update(
      {
        id: roleId,
        tenantId: tenantId ?? IsNull(),
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
      manager,
    );
    return (result.affected ?? 0) > 0;
  }

  async findById(roleId: string, tenantId: string | null, manager?: EntityManager): Promise<Role | null> {
    return this.findOne(
      {
        where: {
          tenantId: tenantId ?? IsNull(),
          id: roleId,
          isDeleted: false,
        },
      },
      manager,
    );
  }

  async findByName(roleName: string, tenantId: string | null, manager?: EntityManager): Promise<Role | null> {
    return this.findOne(
      {
        where: {
          tenantId: tenantId ?? IsNull(),
          name: roleName,
          isDeleted: false,
        },
      },
      manager,
    );
  }

  async findAll(tenantId: string | null, manager?: EntityManager): Promise<Role[]> {
    return this.find(
      {
        where: {
          tenantId: tenantId ?? IsNull(),
          isDeleted: false,
        },
      },
      manager,
    );
  }

  async findPaginated(
    tenantId: string | null,
    page: number,
    pageSize: number,
    sortBy: keyof Role,
    sortOrder: 'ASC' | 'DESC',
    search?: string,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<Role>> {
    const whereClause: FindOptionsWhere<Role> = {
      isDeleted: false,
      tenantId: tenantId ?? IsNull(),
    };

    if (search && search.trim() !== '') {
      whereClause.name = ILike(`%${search.trim()}%`);
    }

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where: whereClause,
        order: {
          [sortBy]: sortOrder,
        },
      },
      manager,
    );
  }
}
