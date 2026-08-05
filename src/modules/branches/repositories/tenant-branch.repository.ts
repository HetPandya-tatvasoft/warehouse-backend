import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { TenantBranch } from '../entities/tenant-branch.entity';
import { BranchStatus } from '../enums/branch-status.enum';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { IPaginatedResponse } from '@/common/types/api-response.interface';

@Injectable()
export class TenantBranchRepository extends BaseRepository<TenantBranch> {
  constructor(
    @InjectRepository(TenantBranch)
    repository: Repository<TenantBranch>,
  ) {
    super(TenantBranch, repository);
  }

  async findByIdAndTenant(id: string, tenantId: string, manager?: EntityManager): Promise<TenantBranch | null> {
    return this.findOne(
      {
        where: {
          id,
          tenantId,
          isDeleted: false,
        },
        relations: {
          address: {
            city: true,
            state: true,
            country: true,
          },
        },
      },
      manager,
    );
  }

  async findByNameAndTenant(name: string, tenantId: string, manager?: EntityManager): Promise<TenantBranch | null> {
    return this.findOne(
      {
        where: {
          name,
          tenantId,
          isDeleted: false,
        },
      },
      manager,
    );
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    sortBy: keyof TenantBranch = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: BranchStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<TenantBranch>> {
    const whereCondition: FindOptionsWhere<TenantBranch> = {
      tenantId,
      isDeleted: false,
    };

    if (status) {
      whereCondition.status = status;
    }

    const where = search?.trim()
      ? {
          ...whereCondition,
          name: ILike(`%${search.trim()}%`),
        }
      : whereCondition;

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order: {
          [sortBy]: sortOrder,
        },
        relations: {
          address: {
            city: true,
            state: true,
            country: true,
          },
        },
      },
      manager,
    );
  }
}
