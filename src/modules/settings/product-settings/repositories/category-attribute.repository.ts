import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import { ProductCategoryAttribute } from '../entities/category-attribute.entity';

@Injectable()
export class CategoryAttributeRepository extends BaseRepository<ProductCategoryAttribute> {
  constructor(
    @InjectRepository(ProductCategoryAttribute)
    repository: Repository<ProductCategoryAttribute>,
  ) {
    super(ProductCategoryAttribute, repository);
  }

  async findByCategoryId(
    tenantId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<ProductCategoryAttribute[]> {
    return this.find(
      {
        where: { tenantId, categoryId },
        relations: { attribute: true },
        order: { createdAt: 'ASC' },
      },
      manager,
    );
  }

  async findByCategoryIds(
    tenantId: string,
    categoryIds: string[],
    manager?: EntityManager,
  ): Promise<ProductCategoryAttribute[]> {
    if (categoryIds.length === 0) {
      return [];
    }
    return this.find(
      {
        where: { tenantId, categoryId: In(categoryIds) },
        relations: { attribute: true },
        order: { createdAt: 'ASC' },
      },
      manager,
    );
  }

  async findByCategoryIdAndAttributeId(
    tenantId: string,
    categoryId: string,
    attributeId: string,
    manager?: EntityManager,
  ): Promise<ProductCategoryAttribute | null> {
    return this.findOne(
      {
        where: { tenantId, categoryId, attributeId },
        relations: { attribute: true },
      },
      manager,
    );
  }

  async countByAttributeId(tenantId: string, attributeId: string, manager?: EntityManager): Promise<number> {
    const repo = this.getRepository(manager);
    return repo.count({
      where: { tenantId, attributeId },
    });
  }

  async deleteByCategoryIdAndAttributeId(
    tenantId: string,
    categoryId: string,
    attributeId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepository(manager);
    await repo.delete({ tenantId, categoryId, attributeId });
  }

  async deleteByCategoryId(tenantId: string, categoryId: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepository(manager);
    await repo.delete({ tenantId, categoryId });
  }
}
