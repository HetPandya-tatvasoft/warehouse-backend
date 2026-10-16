import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUUID } from 'class-validator';
import type { EntityManager } from 'typeorm';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { AttributeRepository } from '../repositories/attribute.repository';
import { AttributeValueRepository } from '../repositories/attribute-value.repository';
import type { UpsertAttributeValueDto } from '../dto/attribute-value/upsert-attribute-value.dto';
import type { AttributeValuePaginationQueryDto } from '../dto/attribute-value/attribute-value-pagination.dto';
import type { AttributeValueResponseDto } from '../dto/attribute-value/attribute-value-response.dto';
import { AttributeValueMapper } from '../mappers/attribute-value.mapper';
import { AttributeStatus } from '../enums/attribute-status.enum';
import type { ProductAttribute } from '../entities/attribute.entity';
import type { ProductAttributeValue } from '../entities/attribute-value.entity';
import { attributeDuplicate, handleAttributeWriteError } from '../errors/attribute-conflict.util';

interface IAttributeValueWriteResult {
  savedValue: ProductAttributeValue;
  parent: ProductAttribute;
}

@Injectable()
export class AttributeValueService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
  ) {}

  async createAttributeValue(
    attributeId: string,
    dto: UpsertAttributeValueDto,
    user: ICurrentUserData,
  ): Promise<AttributeValueResponseDto> {
    const tenantId = this.requireTenant(user);
    if (dto.status === null) throw new BadRequestException(MESSAGES.PRODUCT_ATTRIBUTE_VALUE.STATUS_NULL);
    try {
      const { savedValue, parent } = await this.dataSource.transaction<IAttributeValueWriteResult>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<IAttributeValueWriteResult> => {
          const parent = await this.requireParent(attributeId, tenantId, true, manager);
          const conflict = await this.attributeValueRepository.findLabelConflict(
            attributeId,
            tenantId,
            dto.label,
            undefined,
            manager,
          );
          if (conflict) throw attributeDuplicate(conflict.status, 'value');
          const value = this.attributeValueRepository.create(
            { attributeId, label: dto.label, status: dto.status ?? AttributeStatus.ACTIVE },
            manager,
          );
          const savedValue = await this.attributeValueRepository.save(value, manager);
          return { savedValue, parent };
        },
      );
      return AttributeValueMapper.toResponseDto(savedValue, parent);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return handleAttributeWriteError(error, 'value');
    }
  }

  async getAttributeValuesPaginated(
    attributeId: string,
    query: AttributeValuePaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<AttributeValueResponseDto>> {
    const tenantId = this.requireTenant(user);
    await this.requireParent(attributeId, tenantId);
    const { page = 1, pageSize = 10, sortOrder = 'DESC', search, status } = query;
    const { items, ...paginationData } = await this.attributeValueRepository.findPaginated(
      attributeId,
      tenantId,
      page,
      pageSize,
      sortOrder,
      search,
      status,
    );
    return {
      items: items.map((value) => AttributeValueMapper.toResponseDto(value, value.attribute)),
      ...paginationData,
    };
  }

  async getAttributeValueById(
    attributeId: string,
    valueId: string,
    user: ICurrentUserData,
  ): Promise<AttributeValueResponseDto> {
    const tenantId = this.requireTenant(user);
    await this.requireParent(attributeId, tenantId);
    const value = await this.attributeValueRepository.findById(attributeId, valueId, tenantId);
    if (!value) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT_ATTRIBUTE_VALUE.NOT_FOUND,
        errorCode: 'ATTRIBUTE_VALUE_NOT_FOUND',
      });
    }
    return AttributeValueMapper.toResponseDto(value, value.attribute);
  }

  async updateAttributeValue(
    attributeId: string,
    valueId: string,
    dto: UpsertAttributeValueDto,
    user: ICurrentUserData,
  ): Promise<AttributeValueResponseDto> {
    const tenantId = this.requireTenant(user);
    if (dto.status === null) throw new BadRequestException(MESSAGES.PRODUCT_ATTRIBUTE_VALUE.STATUS_NULL);
    try {
      const { savedValue, parent } = await this.dataSource.transaction<IAttributeValueWriteResult>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<IAttributeValueWriteResult> => {
          const parent = await this.requireParent(attributeId, tenantId, true, manager);
          const value = await this.attributeValueRepository.findOne(
            {
              where: { id: valueId, attributeId, attribute: { tenantId } },
              // Lock only the value; the parent is already locked above.
              lock: { mode: 'pessimistic_write', tables: ['product_attribute_values'] },
            },
            manager,
          );
          if (!value) {
            throw new NotFoundException({
              message: MESSAGES.PRODUCT_ATTRIBUTE_VALUE.NOT_FOUND,
              errorCode: 'ATTRIBUTE_VALUE_NOT_FOUND',
            });
          }
          const newLabel = dto.label !== undefined ? dto.label : value.label;
          if (dto.label !== undefined) {
            const conflict = await this.attributeValueRepository.findLabelConflict(
              attributeId,
              tenantId,
              newLabel,
              valueId,
              manager,
            );
            if (conflict) throw attributeDuplicate(conflict.status, 'value');
            value.label = newLabel;
          }
          if (dto.status !== undefined) value.status = dto.status;
          const savedValue = await this.attributeValueRepository.save(value, manager);
          return { savedValue, parent };
        },
      );
      return AttributeValueMapper.toResponseDto(savedValue, parent);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return handleAttributeWriteError(error, 'value');
    }
  }

  async deleteAttributeValue(attributeId: string, valueId: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);
    try {
      await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
        await this.requireParent(attributeId, tenantId, true, manager);
        const value = await this.attributeValueRepository.findOne(
          {
            where: { id: valueId, attributeId, attribute: { tenantId } },
            lock: { mode: 'pessimistic_write', tables: ['product_attribute_values'] },
          },
          manager,
        );
        if (!value) {
          throw new NotFoundException({
            message: MESSAGES.PRODUCT_ATTRIBUTE_VALUE.NOT_FOUND,
            errorCode: 'ATTRIBUTE_VALUE_NOT_FOUND',
          });
        }
        await this.attributeValueRepository.delete({ id: valueId, attributeId }, manager);
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      handleAttributeWriteError(error, 'value');
    }
  }

  private async requireParent(
    id: string,
    tenantId: string,
    lock: boolean = false,
    manager?: EntityManager,
  ): Promise<ProductAttribute> {
    const parent = lock
      ? await this.attributeRepository.findOne(
          { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
          manager,
        )
      : await this.attributeRepository.findById(id, tenantId, manager);
    if (!parent) {
      throw new NotFoundException({ message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND, errorCode: 'ATTRIBUTE_NOT_FOUND' });
    }
    return parent;
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
