import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus } from '../enums/tenant-status.enum';
import { User } from '../../users/entities/user.entity';
import { ITenantWithAdmin } from '../mappers/tenant.mapper';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repository: Repository<Tenant>,
  ) {}

  async findBySlug(
    slug: string,
    options?: { includeDeleted?: boolean },
    manager?: EntityManager,
  ): Promise<Tenant | null> {
    const repo = manager ? manager.getRepository(Tenant) : this.repository;
    return repo.findOne({
      where: {
        slug,
        ...(options?.includeDeleted ? {} : { isDeleted: false }),
      },
    });
  }

  async createTenant(tenantData: DeepPartial<Tenant>, manager?: EntityManager): Promise<Tenant> {
    const repo = manager ? manager.getRepository(Tenant) : this.repository;
    const tenant = repo.create(tenantData);
    return repo.save(tenant);
  }

  async findPaginated(
    page: number,
    pageSize: number,
    sortBy: keyof Tenant = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: TenantStatus,
    manager?: EntityManager,
  ): Promise<[ITenantWithAdmin[], number]> {
    const repo = manager ? manager.getRepository(Tenant) : this.repository;
    const whereCondition: FindOptionsWhere<Tenant> = {
      isDeleted: false,
    };

    if (status) {
      whereCondition.status = status;
    }

    let tenants: ITenantWithAdmin[];
    let total: number;

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      [tenants, total] = await repo.findAndCount({
        where: [
          { ...whereCondition, name: ILike(searchTerm) },
          { ...whereCondition, companyEmail: ILike(searchTerm) },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          [sortBy]: sortOrder,
        },
      });
    } else {
      [tenants, total] = await repo.findAndCount({
        where: whereCondition,
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          [sortBy]: sortOrder,
        },
      });
    }

    if (tenants.length > 0) {
      const tenantIds = tenants.map((tenant) => tenant.id);
      const userRepo = manager ? manager.getRepository(User) : repo.manager.getRepository(User);
      const users = await userRepo.find({
        where: {
          tenantId: In(tenantIds),
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const userMap = new Map<string, User>();
      for (const user of users) {
        if (user.tenantId && !userMap.has(user.tenantId)) {
          userMap.set(user.tenantId, user);
        }
      }

      for (const tenant of tenants) {
        tenant.primaryAdmin = userMap.get(tenant.id);
      }
    }

    return [tenants, total];
  }
}
