import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, EntityManager } from 'typeorm';
import { ProductCategory } from '../entities/category.entity';
import { ProductCategoryStatus } from '../enums/categoryStatus.enum';
import { BaseRepository } from '../../../../common/repositories/base.repository';
import { IPaginatedResponse } from '@/common/types/api-response.interface';

@Injectable()
export class CategoryRepository extends BaseRepository<ProductCategory> {
  constructor(
    @InjectRepository(ProductCategory)
    repository: Repository<ProductCategory>,
  ) {
    super(ProductCategory, repository);
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    sortBy: keyof ProductCategory = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: ProductCategoryStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<ProductCategory>> {
    const whereCondition: FindOptionsWhere<ProductCategory> = {
      tenantId,
    };

    if (status) {
      whereCondition.status = status;
    }

    const normalizedSearch = search?.trim();
    const where: FindOptionsWhere<ProductCategory> | FindOptionsWhere<ProductCategory>[] = normalizedSearch
      ? [{ ...whereCondition, name: ILike(`%${normalizedSearch}%`) }]
      : whereCondition;

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order: {
          [sortBy]: sortOrder,
        },
      },
      manager,
    );
  }
}
