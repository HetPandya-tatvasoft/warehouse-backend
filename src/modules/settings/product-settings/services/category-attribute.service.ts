import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';

import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { CategoryRepository } from '../repositories/category.repository';
import { AttributeRepository } from '../repositories/attribute.repository';
import { AttributeValueRepository } from '../repositories/attribute-value.repository';
import { CategoryAttributeRepository } from '../repositories/category-attribute.repository';
import { ProductCategory } from '../entities/category.entity';
import { ProductCategoryAttribute } from '../entities/category-attribute.entity';
import type { ProductAttribute } from '../entities/attribute.entity';
import type { AssignCategoryAttributesDto } from '../dto/category-attribute/assign-category-attributes.dto';
import type { CategoryAttributeResponseDto } from '../dto/category-attribute/category-attribute-response.dto';
import type { AttributeResponseDto } from '../dto/attribute/attribute-response.dto';
import { AttributeMapper } from '../mappers/attribute.mapper';

@Injectable()
export class CategoryAttributeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly categoryRepository: CategoryRepository,
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
    private readonly categoryAttributeRepository: CategoryAttributeRepository,
  ) {}

  async assignAttributes(
    categoryId: string,
    dto: AssignCategoryAttributesDto,
    user: ICurrentUserData,
  ): Promise<CategoryAttributeResponseDto[]> {
    const tenantId = this.requireTenant(user);

    return this.dataSource.transaction<CategoryAttributeResponseDto[]>(
      'READ COMMITTED',
      async (manager: EntityManager): Promise<CategoryAttributeResponseDto[]> => {
        const category = await this.getCategoryOrThrow(categoryId, tenantId, manager);
        const ancestors = await this.getAncestorChain(categoryId, tenantId, manager);

        // 1. Lock each attribute in deterministic sorted order to reduce deadlock risk
        const sortedAttributeIds = [...dto.attributeIds].sort((a, b) => a.localeCompare(b));
        const lockedAttributes = new Map<string, ProductAttribute>();
        for (const attributeId of sortedAttributeIds) {
          const attribute = await this.attributeRepository.findOne(
            {
              where: { id: attributeId, tenantId },
              lock: { mode: 'pessimistic_write' },
            },
            manager,
          );
          if (!attribute) {
            throw new NotFoundException({
              message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND,
              errorCode: 'ATTRIBUTE_NOT_FOUND',
            });
          }

          if (attribute.status !== AttributeStatus.ACTIVE) {
            throw new ConflictException({
              message: `Attribute "${attribute.name}" is inactive and cannot be newly assigned to categories.`,
              errorCode: 'ATTRIBUTE_INACTIVE',
            });
          }
          lockedAttributes.set(attributeId, attribute);
        }

        // 2. Read direct and ancestor mappings AFTER acquiring attribute locks to ensure fresh state after any lock wait
        const existingDirect = await this.categoryAttributeRepository.findByCategoryId(tenantId, categoryId, manager);
        const directAttrIds = new Set(existingDirect.map((m) => m.attributeId));

        const ancestorIds = ancestors.map((a) => a.id);
        const ancestorMappings = await this.categoryAttributeRepository.findByCategoryIds(
          tenantId,
          ancestorIds,
          manager,
        );
        const ancestorMappingsByAttrId = new Map<string, ProductCategoryAttribute>();
        for (const mapping of ancestorMappings) {
          if (!ancestorMappingsByAttrId.has(mapping.attributeId)) {
            ancestorMappingsByAttrId.set(mapping.attributeId, mapping);
          }
        }

        // 3. Validate against direct duplicates and ancestor inheritance
        for (const attributeId of dto.attributeIds) {
          const attribute = lockedAttributes.get(attributeId)!;

          if (directAttrIds.has(attributeId)) {
            throw new ConflictException({
              message: `Attribute "${attribute.name}" is already directly assigned to this category.`,
              errorCode: 'ATTRIBUTE_ALREADY_DIRECTLY_ASSIGNED',
            });
          }

          const inheritedMapping = ancestorMappingsByAttrId.get(attributeId);
          if (inheritedMapping) {
            const sourceAncestor = ancestors.find((a) => a.id === inheritedMapping.categoryId);
            throw new ConflictException({
              message: `Attribute "${attribute.name}" is already inherited from ancestor category "${sourceAncestor?.name ?? 'Ancestor'}".`,
              errorCode: 'ATTRIBUTE_ALREADY_INHERITED',
            });
          }
        }

        // Persist new mappings
        for (const attributeId of dto.attributeIds) {
          const newMapping = this.categoryAttributeRepository.create(
            {
              tenantId,
              categoryId,
              attributeId,
            },
            manager,
          );
          await this.categoryAttributeRepository.save(newMapping, manager);
        }

        return this.fetchDirectAttributes(category, tenantId, manager);
      },
    );
  }

  async unassignAttribute(categoryId: string, attributeId: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);

    await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
      await this.getCategoryOrThrow(categoryId, tenantId, manager);

      const directMapping = await this.categoryAttributeRepository.findByCategoryIdAndAttributeId(
        tenantId,
        categoryId,
        attributeId,
        manager,
      );

      if (directMapping) {
        await this.categoryAttributeRepository.deleteByCategoryIdAndAttributeId(
          tenantId,
          categoryId,
          attributeId,
          manager,
        );
        return;
      }

      // Check if inherited
      const attribute = await this.attributeRepository.findById(attributeId, tenantId, manager);
      if (!attribute) {
        throw new NotFoundException({
          message: MESSAGES.PRODUCT_ATTRIBUTE.NOT_FOUND,
          errorCode: 'ATTRIBUTE_NOT_FOUND',
        });
      }

      const ancestors = await this.getAncestorChain(categoryId, tenantId, manager);
      const ancestorIds = ancestors.map((a) => a.id);
      const ancestorMappings = await this.categoryAttributeRepository.findByCategoryIds(tenantId, ancestorIds, manager);
      const inheritedMapping = ancestorMappings.find((m) => m.attributeId === attributeId);

      if (inheritedMapping) {
        const sourceAncestor = ancestors.find((a) => a.id === inheritedMapping.categoryId);
        throw new ConflictException({
          message: `Cannot unassign attribute "${attribute.name}" because it is inherited from ancestor category "${sourceAncestor?.name ?? 'Ancestor'}". Inherited attributes must be managed at their source category.`,
          errorCode: 'CANNOT_UNASSIGN_INHERITED_ATTRIBUTE',
        });
      }

      throw new NotFoundException({
        message: MESSAGES.CATEGORY_ATTRIBUTE.NOT_ASSIGNED,
        errorCode: 'ATTRIBUTE_NOT_ASSIGNED',
      });
    });
  }

  async getDirectAttributes(categoryId: string, user: ICurrentUserData): Promise<CategoryAttributeResponseDto[]> {
    const tenantId = this.requireTenant(user);
    const category = await this.getCategoryOrThrow(categoryId, tenantId);
    return this.fetchDirectAttributes(category, tenantId);
  }

  async getEffectiveAttributes(categoryId: string, user: ICurrentUserData): Promise<CategoryAttributeResponseDto[]> {
    const tenantId = this.requireTenant(user);
    const category = await this.getCategoryOrThrow(categoryId, tenantId);
    const ancestors = await this.getAncestorChain(categoryId, tenantId);

    const directMappings = await this.categoryAttributeRepository.findByCategoryId(tenantId, categoryId);

    const ancestorIds = ancestors.map((a) => a.id);
    const ancestorMappings = await this.categoryAttributeRepository.findByCategoryIds(tenantId, ancestorIds);

    const ancestorMappingsByCatId = new Map<string, ProductCategoryAttribute[]>();
    for (const mapping of ancestorMappings) {
      const list = ancestorMappingsByCatId.get(mapping.categoryId) ?? [];
      list.push(mapping);
      ancestorMappingsByCatId.set(mapping.categoryId, list);
    }

    // Effective attribute resolution map: attributeId -> CategoryAttributeResponseDto
    // Deduplication rule: Direct assignment wins, otherwise nearest ancestor.
    const effectiveMap = new Map<string, CategoryAttributeResponseDto>();

    // 1. Direct assignments win
    for (const mapping of directMappings) {
      if (mapping.attribute) {
        effectiveMap.set(mapping.attributeId, {
          id: mapping.attribute.id,
          name: mapping.attribute.name,
          status: mapping.attribute.status,
          isSelectable: mapping.attribute.status === AttributeStatus.ACTIVE,
          valueCount: 0,
          assignmentType: 'DIRECT',
          sourceCategoryId: category.id,
          sourceCategoryName: category.name,
          assignedAt: mapping.createdAt,
        });
      }
    }

    // 2. Ancestor assignments from nearest to furthest
    for (const ancestor of ancestors) {
      const mappings = ancestorMappingsByCatId.get(ancestor.id) ?? [];
      for (const mapping of mappings) {
        if (mapping.attribute && !effectiveMap.has(mapping.attributeId)) {
          effectiveMap.set(mapping.attributeId, {
            id: mapping.attribute.id,
            name: mapping.attribute.name,
            status: mapping.attribute.status,
            isSelectable: mapping.attribute.status === AttributeStatus.ACTIVE,
            valueCount: 0,
            assignmentType: 'INHERITED',
            sourceCategoryId: ancestor.id,
            sourceCategoryName: ancestor.name,
            assignedAt: mapping.createdAt,
          });
        }
      }
    }

    const effectiveList = Array.from(effectiveMap.values());
    if (effectiveList.length === 0) {
      return [];
    }

    const attributeIds = effectiveList.map((item) => item.id);
    const counts = await this.attributeValueRepository.countByAttributeIds(tenantId, attributeIds);

    for (const item of effectiveList) {
      item.valueCount = counts.get(item.id) ?? 0;
    }

    effectiveList.sort((a, b) => a.name.localeCompare(b.name));
    return effectiveList;
  }

  async getEligibleAttributes(categoryId: string, user: ICurrentUserData): Promise<AttributeResponseDto[]> {
    const tenantId = this.requireTenant(user);
    await this.getCategoryOrThrow(categoryId, tenantId);

    // Get effective attribute IDs (direct + inherited)
    const effective = await this.getEffectiveAttributes(categoryId, user);
    const assignedIds = new Set(effective.map((item) => item.id));

    // Get all ACTIVE attributes in the tenant
    const allActiveAttributes = await this.attributeRepository.find({
      where: {
        tenantId,
        status: AttributeStatus.ACTIVE,
      },
      order: { name: 'ASC' },
    });

    const eligible = allActiveAttributes.filter((attr) => !assignedIds.has(attr.id));
    if (eligible.length === 0) {
      return [];
    }

    const counts = await this.attributeValueRepository.countByAttributeIds(
      tenantId,
      eligible.map((a) => a.id),
    );

    return eligible.map((attr) => AttributeMapper.toResponseDto(attr, counts.get(attr.id) ?? 0));
  }

  private async fetchDirectAttributes(
    category: ProductCategory,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<CategoryAttributeResponseDto[]> {
    const directMappings = await this.categoryAttributeRepository.findByCategoryId(tenantId, category.id, manager);
    if (directMappings.length === 0) {
      return [];
    }

    const attributeIds = directMappings.map((m) => m.attributeId);
    const counts = await this.attributeValueRepository.countByAttributeIds(tenantId, attributeIds, manager);

    const result: CategoryAttributeResponseDto[] = directMappings
      .filter((m) => !!m.attribute)
      .map((m) => ({
        id: m.attribute.id,
        name: m.attribute.name,
        status: m.attribute.status,
        isSelectable: m.attribute.status === AttributeStatus.ACTIVE,
        valueCount: counts.get(m.attribute.id) ?? 0,
        assignmentType: 'DIRECT' as const,
        sourceCategoryId: category.id,
        sourceCategoryName: category.name,
        assignedAt: m.createdAt,
      }));

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }

  private async getCategoryOrThrow(
    categoryId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne(
      {
        where: { id: categoryId, tenantId },
      },
      manager,
    );
    if (!category) {
      throw new NotFoundException(MESSAGES.PRODUCT_CATEGORY.NOT_FOUND);
    }
    return category;
  }

  private async getAncestorChain(
    categoryId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<ProductCategory[]> {
    const ancestors: ProductCategory[] = [];
    let currentId: string | null = categoryId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const category = await this.categoryRepository.findOne(
        {
          where: { id: currentId, tenantId },
          select: { id: true, parentId: true, name: true, status: true },
        },
        manager,
      );
      if (!category) break;

      if (category.id !== categoryId) {
        ancestors.push(category);
      }
      currentId = category.parentId;
    }

    return ancestors;
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
