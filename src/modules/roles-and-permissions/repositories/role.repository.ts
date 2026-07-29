import { Injectable } from '@nestjs/common';
import { Role } from '../entities/role.entity';
import { DeepPartial, EntityManager, FindOptionsWhere, IsNull, Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async createRole(role: DeepPartial<Role>, manager?: EntityManager): Promise<Role> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    const createdRole = repo.create(role);
    return repo.save(createdRole);
  }

  async updateRole(
    roleId: string,
    roleData: DeepPartial<Role>,
    tenantId: string | null,
    manager?: EntityManager,
  ): Promise<Role | null> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    const result = await repo.update(
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
    return this.findById(roleId, tenantId, manager);
  }

  async deleteRole(roleId: string, tenantId: string | null, manager?: EntityManager): Promise<boolean> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    const result = await repo.update(
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

  async findById(roleId: string, tenantId: string | null, manager?: EntityManager): Promise<Role | null> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    return repo.findOne({
      where: {
        tenantId: tenantId ?? IsNull(),
        id: roleId,
        isDeleted: false,
      },
    });
  }

  async findByName(roleName: string, tenantId: string | null, manager?: EntityManager): Promise<Role | null> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    return repo.findOne({
      where: {
        tenantId: tenantId ?? IsNull(),
        name: roleName,
        isDeleted: false,
      },
    });
  }

  async findAll(tenantId: string | null, manager?: EntityManager): Promise<Role[]> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    return repo.find({
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
    search?: string,
    manager?: EntityManager,
  ): Promise<[Role[], number]> {
    const repo = manager ? manager.getRepository(Role) : this.repository;
    const whereClause: FindOptionsWhere<Role> = {
      isDeleted: false,
      tenantId: tenantId ?? IsNull(),
    };

    if (search && search.trim() !== '') {
      whereClause.name = ILike(`%${search.trim()}%`);
    }

    return repo.findAndCount({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        [sortBy]: sortOrder,
      },
    });
  }
}
