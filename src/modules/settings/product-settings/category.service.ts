import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ILike, IsNull } from 'typeorm';
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

    // Validate parent if provided
    if (dto.parentId) {
      await this.validateParent(dto.parentId, tenantId);
    }

    // Check sibling name conflict
    await this.checkSiblingNameConflict(dto.name, dto.parentId, tenantId);

    const categoryInstance = this.categoryRepository.create({
      tenantId,
      parentId: dto.parentId || null,
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

    const newParentId = dto.parentId !== undefined ? dto.parentId : category.parentId;

    // Validate parent if parentId is being updated and not null
    if (dto.parentId !== undefined && dto.parentId !== category.parentId) {
      if (dto.parentId !== null) {
        await this.validateParent(dto.parentId, tenantId);

        // Prevent self parenting
        if (dto.parentId === id) {
          throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.SELF_PARENTING);
        }

        // Prevent circular reference
        const circular = await this.isDescendant(dto.parentId, id, tenantId);
        if (circular) {
          throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.CIRCULAR_DEPENDENCY);
        }
      }
    }

    // Check sibling name conflict
    const newName = dto.name !== undefined ? dto.name : category.name;
    if (dto.name !== undefined || dto.parentId !== undefined) {
      await this.checkSiblingNameConflict(newName, newParentId, tenantId, id);
    }

    await this.categoryRepository.update(
      { id },
      {
        name: dto.name,
        parentId: dto.parentId !== undefined ? dto.parentId || null : undefined,
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

    // Block deletion if category has children
    const childExists = await this.categoryRepository.findOne({
      where: { tenantId, parentId: id },
    });
    if (childExists) {
      throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.HAS_CHILDREN);
    }

    await this.categoryRepository.delete({ id });
  }

  async getCategoryTree(user: ICurrentUserData): Promise<CategoryResponseDto[]> {
    const tenantId = user.tenantId!;
    const categories = await this.categoryRepository.find({
      where: { tenantId },
    });

    const categoryMap = new Map<string, CategoryResponseDto & { children: CategoryResponseDto[] }>();
    for (const cat of categories) {
      categoryMap.set(cat.id, {
        ...CategoryMapper.toResponseDto(cat),
        children: [],
      });
    }

    const rootCategories: CategoryResponseDto[] = [];
    for (const cat of categories) {
      const mapped = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(mapped);
      } else {
        rootCategories.push(mapped);
      }
    }

    const sortTreeNodes = (nodes: (CategoryResponseDto & { children?: CategoryResponseDto[] })[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          sortTreeNodes(node.children);
        }
      }
    };
    sortTreeNodes(rootCategories);
    return rootCategories;
  }

  private async validateParent(parentId: string, tenantId: string): Promise<void> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId, tenantId },
    });
    if (!parent) {
      throw new NotFoundException(MESSAGES.PRODUCT_CATEGORY.NOT_FOUND);
    }
  }

  private async checkSiblingNameConflict(
    name: string,
    parentId: string | null | undefined,
    tenantId: string,
    excludeId?: string,
  ): Promise<void> {
    const cleanParentId = parentId || null;
    const duplicate = await this.categoryRepository.findOne({
      where: {
        tenantId,
        name: ILike(name.trim()),
        parentId: cleanParentId === null ? IsNull() : cleanParentId,
      },
    });
    if (duplicate && duplicate.id !== excludeId) {
      throw new ConflictException(MESSAGES.PRODUCT_CATEGORY.NAME_EXISTS);
    }
  }

  private async isDescendant(parentId: string, targetId: string, tenantId: string): Promise<boolean> {
    let currentParentId: string | null = parentId;
    while (currentParentId) {
      if (currentParentId === targetId) {
        return true;
      }
      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId, tenantId },
        select: { parentId: true },
      });
      if (!parent) {
        break;
      }
      currentParentId = parent.parentId;
    }
    return false;
  }
}
