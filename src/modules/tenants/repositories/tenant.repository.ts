import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus } from '../enums/tenant-status.enum';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { IPaginatedResponse } from '@/common/types/api-response.interface';

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  constructor(
    @InjectRepository(Tenant)
    repository: Repository<Tenant>,
  ) {
    super(Tenant, repository);
  }

  async findBySlug(
    slug: string,
    options?: { includeDeleted?: boolean },
    manager?: EntityManager,
  ): Promise<Tenant | null> {
    return this.findOne(
      {
        where: {
          slug,
          ...(options?.includeDeleted ? {} : { isDeleted: false }),
        },
      },
      manager,
    );
  }

  async findPaginated(
    page: number,
    pageSize: number,
    sortBy: keyof Tenant = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: TenantStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<Tenant>> {
    const whereCondition: FindOptionsWhere<Tenant> = {
      isDeleted: false,
    };

    if (status) {
      whereCondition.status = status;
    }

    const normalizedSearch = search?.trim();

    const where: FindOptionsWhere<Tenant> | FindOptionsWhere<Tenant>[] = normalizedSearch
      ? [
          { ...whereCondition, name: ILike(`%${normalizedSearch}%`) },
          { ...whereCondition, companyEmail: ILike(`%${normalizedSearch}%`) },
        ]
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
