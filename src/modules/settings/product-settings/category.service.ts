import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { CategoryRepository } from './repositories/category.repository';
import { UpsertCategoryDto } from './dto/category/upsert-category.dto';
import { CategoryPaginationQueryDto } from './dto/category/category-pagination.dto';
import { CategoryResponseDto } from './dto/category/category-response.dto';
import { CategoryMapper } from './mappers/category.mapper';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(dto: UpsertCategoryDto, user: ICurrentUserData): Promise<CategoryResponseDto> {
    const tenantId = user.tenantId!;

    const duplicate = await this.categoryRepository.findOne({
      where: { tenantId, name: ILike(dto.name.trim()) },
    });
    if (duplicate) {
      throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.NAME_EXISTS);
    }

    const categoryInstance = this.categoryRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description || null,
      status: dto.status,
    });

    const savedCategory = await this.categoryRepository.save(categoryInstance);
    return CategoryMapper.toResponseDto(savedCategory);
  }

  async getCategoriesPaginated(
    query: CategoryPaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<CategoryResponseDto>> {
    const tenantId = user.tenantId!;
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;

    const { items, ...paginationData } = await this.categoryRepository.findPaginated(
      tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      status,
    );

    return {
      items: items.map((c) => CategoryMapper.toResponseDto(c)),
      ...paginationData,
    };
  }

  async getCategoryById(id: string, user: ICurrentUserData): Promise<CategoryResponseDto> {
    const tenantId = user.tenantId!;
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException(MESSAGES.PRODUCT_CATEGORY.NOT_FOUND);
    }

    return CategoryMapper.toResponseDto(category);
  }

  async updateCategory(id: string, dto: UpsertCategoryDto, user: ICurrentUserData): Promise<CategoryResponseDto> {
    const tenantId = user.tenantId!;
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException(MESSAGES.PRODUCT_CATEGORY.NOT_FOUND);
    }

    if (dto.name) {
      const duplicate = await this.categoryRepository.findOne({
        where: { tenantId, name: ILike(dto.name.trim()) },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.NAME_EXISTS);
      }
    }

    await this.categoryRepository.update(
      { id },
      {
        name: dto.name,
        description: dto.description !== undefined ? dto.description : undefined,
        status: dto.status,
      },
    );

    const updatedCategory = (await this.categoryRepository.findOne({ where: { id, tenantId } }))!;
    return CategoryMapper.toResponseDto(updatedCategory);
  }

  async deleteCategory(id: string, user: ICurrentUserData): Promise<void> {
    const tenantId = user.tenantId!;
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException(MESSAGES.PRODUCT_CATEGORY.NOT_FOUND);
    }

    await this.categoryRepository.delete({ id });
  }
}
