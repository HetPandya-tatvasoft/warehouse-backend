import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not } from 'typeorm';
import type { EntityManager, FindOptionsWhere, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { ProductBrand } from '../entities/brand.entity';
import type { BrandStatus } from '../enums/brand-status.enum';

@Injectable()
export class BrandRepository extends BaseRepository<ProductBrand> {
  constructor(@InjectRepository(ProductBrand) repository: Repository<ProductBrand>) {
    super(ProductBrand, repository);
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    sortBy: keyof ProductBrand = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: BrandStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<ProductBrand>> {
    const where: FindOptionsWhere<ProductBrand> = { tenantId };
    if (status) {
      where.status = status;
    }
    if (search?.trim()) {
      where.name = ILike(`%${search.trim()}%`);
    }

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order: { [sortBy]: sortOrder },
      },
      manager,
    );
  }

  async findById(id: string, tenantId: string, manager?: EntityManager): Promise<ProductBrand | null> {
    return this.findOne({ where: { id, tenantId } }, manager);
  }

  async findNameConflict(
    tenantId: string,
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<ProductBrand | null> {
    const where: FindOptionsWhere<ProductBrand> = {
      tenantId,
      name: ILike(name.replace(/[\\%_]/g, '\\$&')),
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    return this.findOne({ where }, manager);
  }
}
