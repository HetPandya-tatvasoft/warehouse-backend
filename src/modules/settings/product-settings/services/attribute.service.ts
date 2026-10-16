import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { AttributeRepository } from '../repositories/attribute.repository';
import { AttributeValueRepository } from '../repositories/attribute-value.repository';
import type { UpsertAttributeDto } from '../dto/attribute/upsert-attribute.dto';
import type { AttributePaginationQueryDto } from '../dto/attribute/attribute-pagination.dto';
import type { AttributeResponseDto } from '../dto/attribute/attribute-response.dto';
import { AttributeMapper } from '../mappers/attribute.mapper';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { attributeDuplicate, handleAttributeWriteError } from '../errors/attribute-conflict.util';
import type { ProductAttribute } from '../entities/attribute.entity';

interface IAttributeWriteResult {
  savedAttribute: ProductAttribute;
  valueCount: number;
}

@Injectable()
export class AttributeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async createAttribute(dto: UpsertAttributeDto, user: ICurrentUserData): Promise<AttributeResponseDto> {
    const tenantId = this.requireTenant(user);
    try {
      const savedAttribute = await this.dataSource.transaction<ProductAttribute>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<ProductAttribute> => {
          const conflict = await this.attributeRepository.findNameConflict(tenantId, dto.name, undefined, manager);
          if (conflict) throw attributeDuplicate(conflict.status);
          const attribute = this.attributeRepository.create(
            { tenantId, name: dto.name, status: dto.status ?? AttributeStatus.ACTIVE },
            manager,
          );
          return this.attributeRepository.save(attribute, manager);
        },
      );
      return AttributeMapper.toResponseDto(savedAttribute, 0);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return handleAttributeWriteError(error);
    }
  }

  async getAttributesPaginated(
    query: AttributePaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<AttributeResponseDto>> {
    const tenantId = this.requireTenant(user);
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;
    const { items, ...paginationData } = await this.attributeRepository.findPaginated(
      tenantId,
      page,
      pageSize,
      sortBy === 'name' ? 'name' : 'createdAt',
      sortOrder,
      search,
      status,
    );
    const counts = await this.attributeValueRepository.countByAttributeIds(
      tenantId,
      items.map((attribute) => attribute.id),
    );
    return {
      items: items.map((attribute) => AttributeMapper.toResponseDto(attribute, counts.get(attribute.id) ?? 0)),
      ...paginationData,
    };
  }

  async getAttributeById(id: string, user: ICurrentUserData): Promise<AttributeResponseDto> {
    const tenantId = this.requireTenant(user);
    const attribute = await this.attributeRepository.findById(id, tenantId);
    if (!attribute) {
      throw new NotFoundException({ message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND, errorCode: 'ATTRIBUTE_NOT_FOUND' });
    }
    const counts = await this.attributeValueRepository.countByAttributeIds(tenantId, [id]);
    return AttributeMapper.toResponseDto(attribute, counts.get(id) ?? 0);
  }

  async updateAttribute(id: string, dto: UpsertAttributeDto, user: ICurrentUserData): Promise<AttributeResponseDto> {
    const tenantId = this.requireTenant(user);
    try {
      const { savedAttribute, valueCount } = await this.dataSource.transaction<IAttributeWriteResult>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<IAttributeWriteResult> => {
          const attribute = await this.attributeRepository.findOne(
            { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
            manager,
          );
          if (!attribute) {
            throw new NotFoundException({
              message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND,
              errorCode: 'ATTRIBUTE_NOT_FOUND',
            });
          }
          const newName = dto.name !== undefined ? dto.name : attribute.name;
          if (dto.name !== undefined) {
            const conflict = await this.attributeRepository.findNameConflict(tenantId, newName, id, manager);
            if (conflict) throw attributeDuplicate(conflict.status);
            attribute.name = newName;
          }
          if (dto.status !== undefined) attribute.status = dto.status;
          const saved = await this.attributeRepository.save(attribute, manager);
          const counts = await this.attributeValueRepository.countByAttributeIds(tenantId, [id], manager);
          return { savedAttribute: saved, valueCount: counts.get(id) ?? 0 };
        },
      );
      return AttributeMapper.toResponseDto(savedAttribute, valueCount);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return handleAttributeWriteError(error);
    }
  }

  async deleteAttribute(id: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);
    try {
      await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
        const attribute = await this.attributeRepository.findOne(
          { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
          manager,
        );
        if (!attribute) {
          throw new NotFoundException({
            message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND,
            errorCode: 'ATTRIBUTE_NOT_FOUND',
          });
        }
        // Ownership is validated and locked until both deletions commit.
        await this.attributeValueRepository.delete({ attributeId: attribute.id }, manager);
        await this.attributeRepository.delete({ id, tenantId }, manager);
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      handleAttributeWriteError(error);
    }
  }

  private requireTenant(user: ICurrentUserData): string {
    if (typeof user?.tenantId !== 'string' || !isUUID(user.tenantId)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT_ATTRIBUTE.TENANT_REQUIRED,
        errorCode: 'TENANT_CONTEXT_REQUIRED',
      });
    }
    return user.tenantId;
  }
}
