import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { UnitOfMeasureRepository } from '../repositories/unit-of-measure.repository';
import type { UpsertUnitOfMeasureDto } from '../dto/unit-of-measure/upsert-unit-of-measure.dto';
import type { UnitOfMeasurePaginationQueryDto } from '../dto/unit-of-measure/unit-of-measure-pagination.dto';
import type { UnitOfMeasureResponseDto } from '../dto/unit-of-measure/unit-of-measure-response.dto';
import { UnitOfMeasureMapper } from '../mappers/unit-of-measure.mapper';
import { UnitOfMeasureStatus } from '../enums/unit-of-measure-status.enum';
import type { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly uomRepository: UnitOfMeasureRepository,
  ) {}

  async createUnitOfMeasure(dto: UpsertUnitOfMeasureDto, user: ICurrentUserData): Promise<UnitOfMeasureResponseDto> {
    const tenantId = this.requireTenant(user);

    try {
      const savedUnit = await this.dataSource.transaction<UnitOfMeasure>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<UnitOfMeasure> => {
          const nameConflict = await this.uomRepository.findNameConflict(tenantId, dto.name, undefined, manager);
          if (nameConflict) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.NAME_EXISTS,
              errorCode: 'UOM_NAME_DUPLICATE',
            });
          }

          const codeConflict = await this.uomRepository.findCodeConflict(tenantId, dto.code, undefined, manager);
          if (codeConflict) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.CODE_EXISTS,
              errorCode: 'UOM_CODE_DUPLICATE',
            });
          }

          const unit = this.uomRepository.create(
            {
              tenantId,
              name: dto.name,
              code: dto.code,
              allowsFractionalQuantity: dto.allowsFractionalQuantity,
              status: dto.status ?? UnitOfMeasureStatus.ACTIVE,
            },
            manager,
          );

          return this.uomRepository.save(unit, manager);
        },
      );

      return UnitOfMeasureMapper.toResponseDto(savedUnit);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async getUnitsOfMeasurePaginated(
    query: UnitOfMeasurePaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<UnitOfMeasureResponseDto>> {
    const tenantId = this.requireTenant(user);
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;

    const { items, ...paginationData } = await this.uomRepository.findPaginated(
      tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      status,
    );

    return {
      items: items.map((item) => UnitOfMeasureMapper.toResponseDto(item)),
      ...paginationData,
    };
  }

  async getUnitOfMeasureById(id: string, user: ICurrentUserData): Promise<UnitOfMeasureResponseDto> {
    const tenantId = this.requireTenant(user);
    const unit = await this.uomRepository.findById(id, tenantId);

    if (!unit) {
      throw new NotFoundException(MESSAGES.PRODUCT_UNIT_OF_MEASURE.NOT_FOUND);
    }

    return UnitOfMeasureMapper.toResponseDto(unit);
  }

  async updateUnitOfMeasure(
    id: string,
    dto: UpsertUnitOfMeasureDto,
    user: ICurrentUserData,
  ): Promise<UnitOfMeasureResponseDto> {
    const tenantId = this.requireTenant(user);

    if (
      dto.name === undefined &&
      dto.code === undefined &&
      dto.allowsFractionalQuantity === undefined &&
      dto.status === undefined
    ) {
      throw new BadRequestException({
        message: 'At least one field must be provided for update.',
        errorCode: 'EMPTY_UPDATE',
      });
    }

    if (dto.name === null || dto.code === null || dto.allowsFractionalQuantity === null || dto.status === null) {
      throw new BadRequestException({
        message: 'Null values are not allowed for update fields.',
        errorCode: 'INVALID_INPUT',
      });
    }

    try {
      const savedUnit = await this.dataSource.transaction<UnitOfMeasure>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<UnitOfMeasure> => {
          const unit = await this.uomRepository.findOne(
            { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
            manager,
          );

          if (!unit) {
            throw new NotFoundException(MESSAGES.PRODUCT_UNIT_OF_MEASURE.NOT_FOUND);
          }

          if (dto.name !== undefined) {
            const nameConflict = await this.uomRepository.findNameConflict(tenantId, dto.name, id, manager);
            if (nameConflict) {
              throw new ConflictException({
                message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.NAME_EXISTS,
                errorCode: 'UOM_NAME_DUPLICATE',
              });
            }
            unit.name = dto.name;
          }

          if (dto.code !== undefined) {
            const codeConflict = await this.uomRepository.findCodeConflict(tenantId, dto.code, id, manager);
            if (codeConflict) {
              throw new ConflictException({
                message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.CODE_EXISTS,
                errorCode: 'UOM_CODE_DUPLICATE',
              });
            }
            unit.code = dto.code;
          }

          if (dto.allowsFractionalQuantity !== undefined) {
            unit.allowsFractionalQuantity = dto.allowsFractionalQuantity;
          }

          if (dto.status !== undefined) {
            unit.status = dto.status;
          }

          return this.uomRepository.save(unit, manager);
        },
      );

      return UnitOfMeasureMapper.toResponseDto(savedUnit);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteUnitOfMeasure(id: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);

    try {
      await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
        const unit = await this.uomRepository.findOne(
          { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
          manager,
        );

        if (!unit) {
          throw new NotFoundException(MESSAGES.PRODUCT_UNIT_OF_MEASURE.NOT_FOUND);
        }

        await this.uomRepository.delete({ id, tenantId }, manager);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof HttpException) throw error;

    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string; constraint?: string; detail?: string };
      if (driverError?.code === '23505') {
        const constraint = driverError.constraint ?? '';
        const detail = driverError.detail ?? '';
        if (constraint.includes('code') || detail.includes('code')) {
          throw new ConflictException({
            message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.CODE_EXISTS,
            errorCode: 'UOM_CODE_DUPLICATE',
          });
        }
        throw new ConflictException({
          message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.NAME_EXISTS,
          errorCode: 'UOM_NAME_DUPLICATE',
        });
      }
    }

    throw error as Error;
  }

  private requireTenant(user: ICurrentUserData): string {
    if (typeof user?.tenantId !== 'string' || !isUUID(user.tenantId)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT_UNIT_OF_MEASURE.TENANT_REQUIRED,
        errorCode: 'TENANT_CONTEXT_REQUIRED',
      });
    }
    return user.tenantId;
  }
}
