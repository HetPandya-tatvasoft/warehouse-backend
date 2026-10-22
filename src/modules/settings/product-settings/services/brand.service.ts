import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { BrandRepository } from '../repositories/brand.repository';
import type { UpsertBrandDto } from '../dto/brand/upsert-brand.dto';
import type { BrandPaginationQueryDto } from '../dto/brand/brand-pagination.dto';
import type { BrandResponseDto } from '../dto/brand/brand-response.dto';
import { BrandMapper } from '../mappers/brand.mapper';
import { BrandStatus } from '../enums/brand-status.enum';
import type { ProductBrand } from '../entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly brandRepository: BrandRepository,
  ) {}

  async createBrand(dto: UpsertBrandDto, user: ICurrentUserData): Promise<BrandResponseDto> {
    const tenantId = this.requireTenant(user);
    try {
      const savedBrand = await this.dataSource.transaction<ProductBrand>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<ProductBrand> => {
          const conflict = await this.brandRepository.findNameConflict(tenantId, dto.name, undefined, manager);
          if (conflict) {
            throw new ConflictException(MESSAGES.PRODUCT_BRAND.NAME_EXISTS);
          }
          const brand = this.brandRepository.create(
            { tenantId, name: dto.name, status: dto.status ?? BrandStatus.ACTIVE },
            manager,
          );
          return this.brandRepository.save(brand, manager);
        },
      );
      return BrandMapper.toResponseDto(savedBrand);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async getBrandsPaginated(
    query: BrandPaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<BrandResponseDto>> {
    const tenantId = this.requireTenant(user);
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;
    const { items, ...paginationData } = await this.brandRepository.findPaginated(
      tenantId,
      page,
      pageSize,
      sortBy as keyof ProductBrand,
      sortOrder,
      search,
      status,
    );
    return {
      items: items.map((item) => BrandMapper.toResponseDto(item)),
      ...paginationData,
    };
  }

  async getBrandById(id: string, user: ICurrentUserData): Promise<BrandResponseDto> {
    const tenantId = this.requireTenant(user);
    const brand = await this.brandRepository.findById(id, tenantId);
    if (!brand) {
      throw new NotFoundException(MESSAGES.PRODUCT_BRAND.NOT_FOUND);
    }
    return BrandMapper.toResponseDto(brand);
  }

  async updateBrand(id: string, dto: UpsertBrandDto, user: ICurrentUserData): Promise<BrandResponseDto> {
    const tenantId = this.requireTenant(user);

    if (dto.name === undefined && dto.status === undefined) {
      throw new BadRequestException({
        message: 'At least one field must be provided for update.',
        errorCode: 'EMPTY_UPDATE',
      });
    }

    try {
      const savedBrand = await this.dataSource.transaction<ProductBrand>(
        'READ COMMITTED',
        async (manager: EntityManager): Promise<ProductBrand> => {
          const brand = await this.brandRepository.findOne(
            { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
            manager,
          );
          if (!brand) {
            throw new NotFoundException(MESSAGES.PRODUCT_BRAND.NOT_FOUND);
          }
          if (dto.name !== undefined) {
            const conflict = await this.brandRepository.findNameConflict(tenantId, dto.name, id, manager);
            if (conflict) {
              throw new ConflictException(MESSAGES.PRODUCT_BRAND.NAME_EXISTS);
            }
            brand.name = dto.name;
          }
          if (dto.status !== undefined) {
            brand.status = dto.status;
          }
          return this.brandRepository.save(brand, manager);
        },
      );
      return BrandMapper.toResponseDto(savedBrand);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteBrand(id: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);
    try {
      await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
        const brand = await this.brandRepository.findOne(
          { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
          manager,
        );
        if (!brand) {
          throw new NotFoundException(MESSAGES.PRODUCT_BRAND.NOT_FOUND);
        }
        await this.brandRepository.delete({ id, tenantId }, manager);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof HttpException) throw error;
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string };
      if (driverError?.code === '23505') {
        throw new ConflictException(MESSAGES.PRODUCT_BRAND.NAME_EXISTS);
      }
    }
    throw error as Error;
  }

  private requireTenant(user: ICurrentUserData): string {
    if (typeof user?.tenantId !== 'string' || !isUUID(user.tenantId)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT_BRAND.TENANT_REQUIRED,
        errorCode: 'TENANT_CONTEXT_REQUIRED',
      });
    }
    return user.tenantId;
  }
}
