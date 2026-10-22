import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not } from 'typeorm';
import type { EntityManager, FindOptionsWhere, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { ProductAttribute } from '../entities/attribute.entity';
import type { AttributeStatus } from '../enums/attribute-status.enum';

@Injectable()
export class AttributeRepository extends BaseRepository<ProductAttribute> {
  constructor(@InjectRepository(ProductAttribute) repository: Repository<ProductAttribute>) {
    super(ProductAttribute, repository);
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    sortBy: 'name' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: AttributeStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<ProductAttribute>> {
    const where: FindOptionsWhere<ProductAttribute> = { tenantId };
    if (status) {
      where.status = status;
    }
    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[\\%_]/g, '\\$&');
      where.name = ILike(`%${escapedSearch}%`);
    }
    const allowedSortFields: Record<string, keyof ProductAttribute> = {
      name: 'name',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const sortField = allowedSortFields[sortBy] || 'createdAt';

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order: { [sortField]: sortOrder, id: sortOrder },
      },
      manager,
    );
  }

  async findById(id: string, tenantId: string, manager?: EntityManager): Promise<ProductAttribute | null> {
    return this.findOne({ where: { id, tenantId } }, manager);
  }

  async findNameConflict(
    tenantId: string,
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<ProductAttribute | null> {
    const where: FindOptionsWhere<ProductAttribute> = {
      tenantId,
      name: ILike(name.replace(/[\\%_]/g, '\\$&')),
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    return this.findOne({ where }, manager);
  }
}
