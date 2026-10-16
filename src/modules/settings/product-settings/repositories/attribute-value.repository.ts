import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not } from 'typeorm';
import type { EntityManager, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { ProductAttributeValue } from '../entities/attribute-value.entity';
import type { AttributeStatus } from '../enums/attribute-status.enum';

@Injectable()
export class AttributeValueRepository extends BaseRepository<ProductAttributeValue> {
  constructor(@InjectRepository(ProductAttributeValue) repository: Repository<ProductAttributeValue>) {
    super(ProductAttributeValue, repository);
  }

  async findPaginated(
    attributeId: string,
    tenantId: string,
    page: number,
    pageSize: number,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: AttributeStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<ProductAttributeValue>> {
    const where: FindOptionsWhere<ProductAttributeValue> = {
      attributeId,
      attribute: { tenantId },
    };
    if (status) {
      where.status = status;
    }
    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[\\%_]/g, '\\$&');
      where.label = ILike(`%${escapedSearch}%`);
    }
    const relations: FindOptionsRelations<ProductAttributeValue> = { attribute: true };
    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        relations,
        order: { createdAt: sortOrder, id: sortOrder },
      },
      manager,
    );
  }

  async findById(
    attributeId: string,
    valueId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<ProductAttributeValue | null> {
    return this.findOne(
      {
        where: { id: valueId, attributeId, attribute: { tenantId } },
        relations: { attribute: true },
      },
      manager,
    );
  }

  async findLabelConflict(
    attributeId: string,
    tenantId: string,
    label: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<ProductAttributeValue | null> {
    const where: FindOptionsWhere<ProductAttributeValue> = {
      attributeId,
      attribute: { tenantId },
      label: ILike(label.replace(/[\\%_]/g, '\\$&')),
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    return this.findOne({ where }, manager);
  }

  async countByAttributeIds(
    tenantId: string,
    attributeIds: string[],
    manager?: EntityManager,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (attributeIds.length === 0) return counts;

    const repo = manager ? manager.getRepository(ProductAttributeValue) : this.repository;
    const rawCounts = await repo
      .createQueryBuilder('val')
      .innerJoin('val.attribute', 'attr')
      .select('val.attributeId', 'attributeId')
      .addSelect('COUNT(val.id)', 'count')
      .where('attr.tenantId = :tenantId', { tenantId })
      .andWhere('val.attributeId IN (:...attributeIds)', { attributeIds })
      .groupBy('val.attributeId')
      .getRawMany<{ attributeId: string; count: string | number }>();

    for (const row of rawCounts) {
      counts.set(row.attributeId, Number(row.count));
    }
    return counts;
  }
}
