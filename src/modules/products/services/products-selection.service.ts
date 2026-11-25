import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { isUUID } from 'class-validator';
import { MESSAGES } from '@/common/constants/messages.constants';

import { CategoryRepository } from '@/modules/settings/product-settings/repositories/category.repository';
import { BrandRepository } from '@/modules/settings/product-settings/repositories/brand.repository';
import { UnitOfMeasureRepository } from '@/modules/settings/product-settings/repositories/unit-of-measure.repository';
import { AttributeValueRepository } from '@/modules/settings/product-settings/repositories/attribute-value.repository';
import { ProductCategoryStatus } from '@/modules/settings/product-settings/enums/categoryStatus.enum';
import { BrandStatus } from '@/modules/settings/product-settings/enums/brand-status.enum';
import { UnitOfMeasureStatus } from '@/modules/settings/product-settings/enums/unit-of-measure-status.enum';
import { AttributeStatus } from '@/modules/settings/product-settings/enums/attribute-status.enum';
import { CategoryAttributeService } from '@/modules/settings/product-settings/services/category-attribute.service';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import {
  SelectionBrandDto,
  SelectionCategoryAttributeDto,
  SelectionCategoryDto,
  SelectionUomDto,
} from '../dto/response/selection-response.dto';

@Injectable()
export class ProductsSelectionService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly uomRepository: UnitOfMeasureRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
    private readonly categoryAttributeService: CategoryAttributeService,
  ) {}

  async getSelectionCategories(user: ICurrentUserData): Promise<SelectionCategoryDto[]> {
    const tenantId = this.requireTenant(user);
    const categories = await this.categoryRepository.find({
      where: {
        tenantId,
        status: ProductCategoryStatus.ACTIVE,
      },
      select: { id: true, name: true, parentId: true },
      order: { name: 'ASC' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
    }));
  }

  async getSelectionBrands(user: ICurrentUserData): Promise<SelectionBrandDto[]> {
    const tenantId = this.requireTenant(user);
    const brands = await this.brandRepository.find({
      where: {
        tenantId,
        status: BrandStatus.ACTIVE,
      },
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
    }));
  }

  async getSelectionUoms(user: ICurrentUserData): Promise<SelectionUomDto[]> {
    const tenantId = this.requireTenant(user);
    const uoms = await this.uomRepository.find({
      where: {
        tenantId,
        status: UnitOfMeasureStatus.ACTIVE,
      },
      select: { id: true, name: true, code: true, allowsFractionalQuantity: true },
      order: { name: 'ASC' },
    });

    return uoms.map((u) => ({
      id: u.id,
      name: u.name,
      code: u.code,
      allowsFractionalQuantity: u.allowsFractionalQuantity,
    }));
  }

  async getSelectionCategoryAttributes(
    categoryId: string,
    user: ICurrentUserData,
  ): Promise<SelectionCategoryAttributeDto[]> {
    const effectiveAttributes = await this.categoryAttributeService.getEffectiveAttributes(categoryId, user);
    const activeAttributes = effectiveAttributes.filter((a) => a.status === AttributeStatus.ACTIVE);

    if (activeAttributes.length === 0) {
      return [];
    }

    const attributeIds = activeAttributes.map((a) => a.id);
    const activeValues = await this.attributeValueRepository.find({
      where: {
        attributeId: In(attributeIds),
        status: AttributeStatus.ACTIVE,
      },
      order: { label: 'ASC' },
    });

    const valuesByAttr = new Map<string, Array<{ id: string; label: string }>>();
    for (const v of activeValues) {
      if (!valuesByAttr.has(v.attributeId)) {
        valuesByAttr.set(v.attributeId, []);
      }
      valuesByAttr.get(v.attributeId)!.push({ id: v.id, label: v.label });
    }

    return activeAttributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      values: valuesByAttr.get(attr.id) ?? [],
    }));
  }

  private requireTenant(user: ICurrentUserData): string {
    if (typeof user?.tenantId !== 'string' || !isUUID(user.tenantId)) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT.TENANT_REQUIRED,
        errorCode: 'TENANT_CONTEXT_REQUIRED',
      });
    }
    return user.tenantId;
  }
}
