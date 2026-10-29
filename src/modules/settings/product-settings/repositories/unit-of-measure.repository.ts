import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not } from 'typeorm';
import type { EntityManager, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import type { UnitOfMeasureStatus } from '../enums/unit-of-measure-status.enum';

@Injectable()
export class UnitOfMeasureRepository extends BaseRepository<UnitOfMeasure> {
  constructor(@InjectRepository(UnitOfMeasure) repository: Repository<UnitOfMeasure>) {
    super(UnitOfMeasure, repository);
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    sortBy: 'name' | 'code' | 'createdAt' = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    status?: UnitOfMeasureStatus,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<UnitOfMeasure>> {
    let where: FindOptionsWhere<UnitOfMeasure> | FindOptionsWhere<UnitOfMeasure>[];

    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[\\%_]/g, '\\$&');
      const searchCondition = ILike(`%${escapedSearch}%`);
      where = [
        { tenantId, ...(status ? { status } : {}), name: searchCondition },
        { tenantId, ...(status ? { status } : {}), code: searchCondition },
      ];
    } else {
      where = {
        tenantId,
        ...(status ? { status } : {}),
      };
    }

    const allowedSortFields: Record<string, keyof UnitOfMeasure> = {
      name: 'name',
      code: 'code',
      createdAt: 'createdAt',
    };
    const sortField = allowedSortFields[sortBy] || 'createdAt';

    const order: FindOptionsOrder<UnitOfMeasure> = {
      [sortField]: sortOrder,
      id: sortOrder,
    };

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        order,
      },
      manager,
    );
  }

  async findById(id: string, tenantId: string, manager?: EntityManager): Promise<UnitOfMeasure | null> {
    return this.findOne({ where: { id, tenantId } }, manager);
  }

  async findNameConflict(
    tenantId: string,
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<UnitOfMeasure | null> {
    const where: FindOptionsWhere<UnitOfMeasure> = {
      tenantId,
      name: ILike(name.replace(/[\\%_]/g, '\\$&')),
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    return this.findOne({ where }, manager);
  }

  async findCodeConflict(
    tenantId: string,
    code: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<UnitOfMeasure | null> {
    const where: FindOptionsWhere<UnitOfMeasure> = {
      tenantId,
      code: ILike(code.replace(/[\\%_]/g, '\\$&')),
    };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    return this.findOne({ where }, manager);
  }
}
