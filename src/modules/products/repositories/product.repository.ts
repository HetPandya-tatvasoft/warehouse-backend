import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, type FindOptionsWhere, ILike, type Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { Product } from '../entities/product.entity';
import type { ProductStatus } from '../enums/product.enums';
import { SkuGeneratorUtil } from '../utils/sku-generator.util';

export interface ProductFilterOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'status' | 'code';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
}

const VALID_SORT_COLUMNS = new Set(['name', 'createdAt', 'status', 'code']);

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(@InjectRepository(Product) repository: Repository<Product>) {
    super(Product, repository);
  }

  async findPaginated(
    tenantId: string,
    options: ProductFilterOptions,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<Product>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      categoryId,
      brandId,
      status,
    } = options;

    const baseWhere: FindOptionsWhere<Product> = {
      tenantId,
      isDeleted: false,
    };

    if (status) {
      baseWhere.status = status;
    }

    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }

    if (brandId) {
      baseWhere.brandId = brandId;
    }

    let where: FindOptionsWhere<Product> | FindOptionsWhere<Product>[] = baseWhere;

    if (search?.trim()) {
      const searchVal = `%${search.trim()}%`;
      where = [
        { ...baseWhere, name: ILike(searchVal) },
        { ...baseWhere, code: ILike(searchVal) },
      ];
    }

    const safeSortBy = VALID_SORT_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order: {
          [safeSortBy]: safeSortOrder,
          id: 'DESC',
        },
        relations: {
          category: true,
          brand: true,
          baseUom: true,
        },
      },
      manager,
    );
  }

  async findById(id: string, tenantId: string, manager?: EntityManager): Promise<Product | null> {
    return this.findOne({ where: { id, tenantId, isDeleted: false } }, manager);
  }

  async findByIdWithDetails(id: string, tenantId: string, manager?: EntityManager): Promise<Product | null> {
    return this.findOne(
      {
        where: { id, tenantId, isDeleted: false },
        relations: {
          category: true,
          brand: true,
          baseUom: true,
          attributeConfigs: {
            attribute: true,
            valueConfigs: {
              attributeValue: true,
            },
          },
        },
        order: {
          attributeConfigs: {
            orderIndex: 'ASC',
          },
        },
      },
      manager,
    );
  }

  async findByCode(tenantId: string, code: string, manager?: EntityManager): Promise<Product | null> {
    return this.findOne({ where: { tenantId, code, isDeleted: false } }, manager);
  }

  async isCodeInUse(tenantId: string, code: string, manager?: EntityManager): Promise<boolean> {
    const count = await this.count({ where: { tenantId, code, isDeleted: false } }, manager);
    return count > 0;
  }

  async allocateProductCode(tenantId: string, name: string, manager?: EntityManager): Promise<string> {
    const baseCode = SkuGeneratorUtil.generateProductCode(name);
    let candidate = baseCode;
    let suffix = 1;

    while (true) {
      const existing = await this.findOne(
        {
          where: { tenantId, code: candidate },
          select: { id: true },
        },
        manager,
      );
      if (!existing) {
        return candidate;
      }
      candidate = `${baseCode}-${suffix++}`;
    }
  }
}
