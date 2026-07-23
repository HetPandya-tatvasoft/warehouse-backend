import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { DeepPartial, FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async createRole(role: DeepPartial<Role>): Promise<Role> {
    const createdRole = this.repository.create(role);
    return this.repository.save(createdRole);
  }

  async updateRole(roleId: string, roleData: DeepPartial<Role>, tenantId: string | null): Promise<Role | null> {
    const result = await this.repository.update(
      {
        id: roleId,
        tenantId: tenantId ?? IsNull(),
        isDeleted: false,
      },
      roleData,
    );
    if ((result.affected ?? 0) === 0) {
      return null;
    }
    return this.findById(roleId, tenantId);
  }

  async deleteRole(roleId: string, tenantId: string | null): Promise<boolean> {
    const result = await this.repository.update(
      {
        id: roleId,
        tenantId: tenantId ?? IsNull(),
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
    );
    return (result.affected ?? 0) > 0;
  }

  async findById(roleId: string, tenantId: string | null): Promise<Role | null> {
    return this.repository.findOne({
      where: {
        tenantId: tenantId ?? IsNull(),
        id: roleId,
        isDeleted: false,
      },
    });
  }

  async findByName(roleName: string, tenantId: string | null): Promise<Role | null> {
    return this.repository.findOne({
      where: {
        tenantId: tenantId ?? IsNull(),
        name: roleName,
        isDeleted: false,
      },
    });
  }

  async findAll(tenantId: string | null): Promise<Role[]> {
    return this.repository.find({
      where: {
        tenantId: tenantId ?? IsNull(),
        isDeleted: false,
      },
    });
  }

  async findPaginated(
    tenantId: string | null,
    page: number,
    pageSize: number,
    sortBy: keyof Role,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<[Role[], number]> {
    const whereClause: FindOptionsWhere<Role> = {
      isDeleted: false,
      tenantId: tenantId ?? IsNull(),
    };

    return this.repository.findAndCount({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        [sortBy]: sortOrder,
      },
    });
  }
}
