import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { TenantBranch } from '../entities/tenant-branch.entity';
import { BranchStatus } from '../enums/branch-status.enum';

@Injectable()
export class TenantBranchRepository {
  constructor(
    @InjectRepository(TenantBranch)
    private readonly repository: Repository<TenantBranch>,
  ) {}

  async findByIdAndTenant(id: string, tenantId: string, manager?: EntityManager): Promise<TenantBranch | null> {
    const repo = manager ? manager.getRepository(TenantBranch) : this.repository;
    return repo.findOne({
      where: {
        id,
        tenantId,
        isDeleted: false,
      },
    });
  }

  async findByNameAndTenant(name: string, tenantId: string, manager?: EntityManager): Promise<TenantBranch | null> {
    const repo = manager ? manager.getRepository(TenantBranch) : this.repository;
    return repo.findOne({
      where: {
        name,
        tenantId,
        isDeleted: false,
      },
    });
  }

  async createBranch(branchData: DeepPartial<TenantBranch>, manager?: EntityManager): Promise<TenantBranch> {
    const repo = manager ? manager.getRepository(TenantBranch) : this.repository;
    const branch = repo.create(branchData);
    return repo.save(branch);
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
  ): Promise<[TenantBranch[], number]> {
    const repo = manager ? manager.getRepository(TenantBranch) : this.repository;

    const whereCondition: FindOptionsWhere<TenantBranch> = {
      tenantId,
      isDeleted: false,
    };

    if (status) {
      whereCondition.status = status;
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      return repo.findAndCount({
        where: {
          ...whereCondition,
          name: ILike(searchTerm),
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          [sortBy]: sortOrder,
        },
      });
    }

    return repo.findAndCount({
      where: whereCondition,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        [sortBy]: sortOrder,
      },
    });
  }

  async save(branch: TenantBranch, manager?: EntityManager): Promise<TenantBranch> {
    const repo = manager ? manager.getRepository(TenantBranch) : this.repository;
    return repo.save(branch);
  }
}
