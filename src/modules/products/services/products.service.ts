import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';

import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { ProductVariantAttributeValueRepository } from '../repositories/product-variant-attribute-value.repository';
import { ProductAttributeConfigRepository } from '../repositories/product-attribute-config.repository';
import { ProductAttributeConfigValueRepository } from '../repositories/product-attribute-config-value.repository';
import { CategoryRepository } from '@/modules/settings/product-settings/repositories/category.repository';
import { BrandRepository } from '@/modules/settings/product-settings/repositories/brand.repository';
import { UnitOfMeasureRepository } from '@/modules/settings/product-settings/repositories/unit-of-measure.repository';
import { AttributeRepository } from '@/modules/settings/product-settings/repositories/attribute.repository';
import { AttributeValueRepository } from '@/modules/settings/product-settings/repositories/attribute-value.repository';
import { CategoryAttributeService } from '@/modules/settings/product-settings/services/category-attribute.service';
import { ProductCategoryStatus } from '@/modules/settings/product-settings/enums/categoryStatus.enum';
import { BrandStatus } from '@/modules/settings/product-settings/enums/brand-status.enum';
import { UnitOfMeasureStatus } from '@/modules/settings/product-settings/enums/unit-of-measure-status.enum';
import { AttributeStatus } from '@/modules/settings/product-settings/enums/attribute-status.enum';
import type { ProductBrand } from '@/modules/settings/product-settings/entities/brand.entity';
import type { ProductAttributeConfig } from '../entities/product-attribute-config.entity';
import type { ProductVariant } from '../entities/product-variant.entity';
import { ProductAttributeType, ProductStatus, VariantStatus } from '../enums/product.enums';
import { SkuGeneratorUtil } from '../utils/sku-generator.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { PreviewVariantsDto } from '../dto/preview-variants.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { AddVariantsDto } from '../dto/add-variants.dto';
import { UpdateVariantStatusDto } from '../dto/update-variant-status.dto';
import { ProductPaginationQueryDto } from '../dto/product-pagination.dto';
import {
  ProductDetailResponseDto,
  ProductListItemResponseDto,
  ProductVariantResponseDto,
} from '../dto/response/product-response.dto';
import { CandidateVariantPreviewDto, VariantPreviewResponseDto } from '../dto/response/variant-preview-response.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly variantValueRepository: ProductVariantAttributeValueRepository,
    private readonly attributeConfigRepository: ProductAttributeConfigRepository,
    private readonly valueConfigRepository: ProductAttributeConfigValueRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly uomRepository: UnitOfMeasureRepository,
    private readonly attributeRepository: AttributeRepository,
    private readonly attributeValueRepository: AttributeValueRepository,
    private readonly categoryAttributeService: CategoryAttributeService,
  ) {}

  async previewVariants(dto: PreviewVariantsDto, user: ICurrentUserData): Promise<VariantPreviewResponseDto> {
    const tenantId = this.requireTenant(user);

    let productCode = '';
    if (dto.productId) {
      const existing = await this.productRepository.findById(dto.productId, tenantId);
      if (!existing) {
        throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
      }
      productCode = existing.code;
    } else {
      productCode = await this.productRepository.allocateProductCode(tenantId, dto.name);
    }

    const dynamicAttributesInput = (dto.attributes || []).filter((a) => a.type === ProductAttributeType.DYNAMIC);

    if (dynamicAttributesInput.length === 0) {
      const defaultSku = `SKU-${productCode}`;
      return {
        productCode,
        dynamicAttributes: [],
        variants: [
          {
            sku: defaultSku,
            isDefault: true,
            dynamicValueIds: [],
            values: [],
          },
        ],
        totalCombinations: 1,
      };
    }

    // Load attributes and values from database via repositories
    const dynamicConfigs: Array<{
      attributeId: string;
      attributeName: string;
      orderIndex: number;
      values: Array<{ valueId: string; label: string; code: string }>;
    }> = [];

    let orderIndex = 0;
    for (const attrInput of dynamicAttributesInput) {
      const attr = await this.attributeRepository.findOne({
        where: { id: attrInput.attributeId, tenantId },
      });

      if (!attr) {
        throw new NotFoundException({
          message: MESSAGES.PRODUCT.ATTRIBUTE_NOT_FOUND(attrInput.attributeId),
          errorCode: 'ATTRIBUTE_NOT_FOUND',
        });
      }

      const valueIds = attrInput.dynamicValueIds || [];
      if (valueIds.length === 0) {
        throw new BadRequestException({
          message: MESSAGES.PRODUCT.DYNAMIC_ATTRIBUTE_EMPTY_VALUES(attr.name),
          errorCode: 'DYNAMIC_ATTRIBUTE_EMPTY_VALUES',
        });
      }

      const values = await this.attributeValueRepository.find({
        where: valueIds.map((id) => ({ id, attributeId: attr.id, status: AttributeStatus.ACTIVE })),
      });

      if (values.length !== valueIds.length) {
        throw new BadRequestException({
          message: MESSAGES.PRODUCT.DYNAMIC_VALUES_INVALID_OR_INACTIVE(attr.name),
          errorCode: 'ATTRIBUTE_VALUE_INACTIVE_OR_NOT_FOUND',
        });
      }

      const assignedCodes = new Set<string>();
      const configuredValues: Array<{ valueId: string; label: string; code: string }> = [];

      for (const val of values) {
        const code = SkuGeneratorUtil.generateValueCode(val.label, assignedCodes);
        assignedCodes.add(code);
        configuredValues.push({
          valueId: val.id,
          label: val.label,
          code,
        });
      }

      dynamicConfigs.push({
        attributeId: attr.id,
        attributeName: attr.name,
        orderIndex: orderIndex++,
        values: configuredValues,
      });
    }

    // Generate Cartesian combinations bounded
    const combinations: Array<
      Array<{ attributeId: string; attributeName: string; valueId: string; valueLabel: string; code: string }>
    > = [];
    const buildCombinations = (
      index: number,
      current: Array<{ attributeId: string; attributeName: string; valueId: string; valueLabel: string; code: string }>,
    ) => {
      if (combinations.length >= 500) return; // bounded preview
      if (index === dynamicConfigs.length) {
        combinations.push([...current]);
        return;
      }
      const currentAttr = dynamicConfigs[index];
      for (const val of currentAttr.values) {
        current.push({
          attributeId: currentAttr.attributeId,
          attributeName: currentAttr.attributeName,
          valueId: val.valueId,
          valueLabel: val.label,
          code: val.code,
        });
        buildCombinations(index + 1, current);
        current.pop();
      }
    };

    buildCombinations(0, []);

    const candidateVariants: CandidateVariantPreviewDto[] = combinations.map((comb) => {
      const valueCodes = comb.map((c) => c.code);
      const sku = SkuGeneratorUtil.buildSku(productCode, valueCodes);
      return {
        sku,
        isDefault: false,
        dynamicValueIds: comb.map((c) => c.valueId),
        values: comb,
      };
    });

    return {
      productCode,
      dynamicAttributes: dynamicConfigs,
      variants: candidateVariants,
      totalCombinations: candidateVariants.length,
    };
  }

  async createProduct(dto: CreateProductDto, user: ICurrentUserData): Promise<ProductDetailResponseDto> {
    const tenantId = this.requireTenant(user);

    return this.dataSource.transaction<ProductDetailResponseDto>(
      'READ COMMITTED',
      async (manager: EntityManager): Promise<ProductDetailResponseDto> => {
        // 1. Validate Category via CategoryRepository
        const category = await this.categoryRepository.findOne(
          {
            where: { id: dto.categoryId, tenantId },
          },
          manager,
        );
        if (!category || category.status !== ProductCategoryStatus.ACTIVE) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.CATEGORY_NOT_FOUND_OR_INACTIVE,
            errorCode: 'CATEGORY_INACTIVE_OR_NOT_FOUND',
          });
        }

        // 2. Validate Brand if provided via BrandRepository
        let brand: ProductBrand | null = null;
        if (dto.brandId) {
          brand = await this.brandRepository.findOne(
            {
              where: { id: dto.brandId, tenantId },
            },
            manager,
          );
          if (!brand || brand.status !== BrandStatus.ACTIVE) {
            throw new BadRequestException({
              message: MESSAGES.PRODUCT.BRAND_NOT_FOUND_OR_INACTIVE,
              errorCode: 'BRAND_INACTIVE_OR_NOT_FOUND',
            });
          }
        }

        // 3. Validate Base UOM via UnitOfMeasureRepository
        const baseUom = await this.uomRepository.findOne(
          {
            where: { id: dto.baseUomId, tenantId },
          },
          manager,
        );
        if (!baseUom || baseUom.status !== UnitOfMeasureStatus.ACTIVE) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.UOM_NOT_FOUND_OR_INACTIVE,
            errorCode: 'UOM_INACTIVE_OR_NOT_FOUND',
          });
        }

        // 4. Validate Attributes against Category Effective Assignments
        const effectiveCategoryAttrs = await this.categoryAttributeService.getEffectiveAttributes(category.id, user);
        const effectiveAttrMap = new Map(effectiveCategoryAttrs.map((a) => [a.id, a]));

        const attributeInputs = dto.attributes || [];
        const seenAttrIds = new Set<string>();

        const staticConfigsToCreate: Array<{
          attributeId: string;
          staticValueId: string;
          attributeName: string;
        }> = [];

        const dynamicConfigsToCreate: Array<{
          attributeId: string;
          attributeName: string;
          orderIndex: number;
          valueMap: Map<string, { label: string; code: string }>;
        }> = [];

        let dynamicOrder = 0;
        for (const attrInput of attributeInputs) {
          if (seenAttrIds.has(attrInput.attributeId)) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT.DUPLICATE_ATTRIBUTE_SELECTION(attrInput.attributeId),
              errorCode: 'DUPLICATE_ATTRIBUTE_SELECTION',
            });
          }
          seenAttrIds.add(attrInput.attributeId);

          const effectiveAttr = effectiveAttrMap.get(attrInput.attributeId);
          if (!effectiveAttr) {
            throw new BadRequestException({
              message: MESSAGES.PRODUCT.ATTRIBUTE_NOT_ASSIGNED_TO_CATEGORY(attrInput.attributeId),
              errorCode: 'ATTRIBUTE_NOT_ASSIGNED_TO_CATEGORY',
            });
          }
          if (effectiveAttr.status !== AttributeStatus.ACTIVE) {
            throw new BadRequestException({
              message: MESSAGES.PRODUCT.ATTRIBUTE_INACTIVE(effectiveAttr.name),
              errorCode: 'ATTRIBUTE_INACTIVE',
            });
          }

          if (attrInput.type === ProductAttributeType.STATIC) {
            if (!attrInput.staticValueId) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.STATIC_VALUE_REQUIRED(effectiveAttr.name),
                errorCode: 'STATIC_VALUE_REQUIRED',
              });
            }
            const value = await this.attributeValueRepository.findOne(
              {
                where: { id: attrInput.staticValueId, attributeId: attrInput.attributeId },
              },
              manager,
            );
            if (!value || value.status !== AttributeStatus.ACTIVE) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.STATIC_VALUE_INVALID_OR_INACTIVE(effectiveAttr.name),
                errorCode: 'ATTRIBUTE_VALUE_INACTIVE_OR_NOT_FOUND',
              });
            }
            staticConfigsToCreate.push({
              attributeId: attrInput.attributeId,
              staticValueId: value.id,
              attributeName: effectiveAttr.name,
            });
          } else if (attrInput.type === ProductAttributeType.DYNAMIC) {
            const valIds = attrInput.dynamicValueIds || [];
            if (valIds.length === 0) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.DYNAMIC_VALUES_REQUIRED(effectiveAttr.name),
                errorCode: 'DYNAMIC_VALUES_REQUIRED',
              });
            }

            const uniqueValIds = new Set(valIds);
            if (uniqueValIds.size !== valIds.length) {
              throw new ConflictException({
                message: MESSAGES.PRODUCT.DUPLICATE_DYNAMIC_ATTRIBUTE_VALUES(effectiveAttr.name),
                errorCode: 'DUPLICATE_ATTRIBUTE_VALUES',
              });
            }

            const assignedCodes = new Set<string>();
            const valueMap = new Map<string, { label: string; code: string }>();

            for (const valId of valIds) {
              const val = await this.attributeValueRepository.findOne(
                {
                  where: { id: valId, attributeId: attrInput.attributeId },
                },
                manager,
              );
              if (!val || val.status !== AttributeStatus.ACTIVE) {
                throw new BadRequestException({
                  message: MESSAGES.PRODUCT.SELECTED_DYNAMIC_VALUE_INVALID(valId, effectiveAttr.name),
                  errorCode: 'ATTRIBUTE_VALUE_INACTIVE_OR_NOT_FOUND',
                });
              }
              const code = SkuGeneratorUtil.generateValueCode(val.label, assignedCodes);
              assignedCodes.add(code);
              valueMap.set(val.id, { label: val.label, code });
            }

            dynamicConfigsToCreate.push({
              attributeId: attrInput.attributeId,
              attributeName: effectiveAttr.name,
              orderIndex: dynamicOrder++,
              valueMap,
            });
          }
        }

        // 5. Generate and reserve unique product code via ProductRepository
        const productCode = await this.productRepository.allocateProductCode(tenantId, dto.name, manager);

        // 6. Validate Variants & Candidate SKUs
        const submittedVariants = dto.variants;
        if (!submittedVariants || submittedVariants.length === 0) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.VARIANTS_REQUIRED,
            errorCode: 'VARIANTS_REQUIRED',
          });
        }

        // Deduplicate combinations & validate
        const seenCombinationHashes = new Set<string>();
        const preparedVariants: Array<{
          sku: string;
          isDefault: boolean;
          combinationHash: string;
          dynamicValueIds: string[];
        }> = [];

        if (dynamicConfigsToCreate.length === 0) {
          // No dynamic attributes: exactly 1 default variant
          const expectedSku = `SKU-${productCode}`;
          const firstVariant = submittedVariants[0];
          if (firstVariant.sku !== expectedSku) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT.SKU_CONFLICT(expectedSku, firstVariant.sku),
              errorCode: 'SKU_CONFLICT',
            });
          }
          preparedVariants.push({
            sku: expectedSku,
            isDefault: true,
            combinationHash: '',
            dynamicValueIds: [],
          });
        } else {
          // Dynamic attributes present
          for (const varInput of submittedVariants) {
            const valIds = varInput.dynamicValueIds || [];
            if (valIds.length !== dynamicConfigsToCreate.length) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.INVALID_VARIANT_COMBINATION(dynamicConfigsToCreate.length),
                errorCode: 'INVALID_VARIANT_COMBINATION',
              });
            }

            const combinationValueCodes: string[] = [];
            for (const dynConfig of dynamicConfigsToCreate) {
              const matchedValId = valIds.find((id) => dynConfig.valueMap.has(id));
              if (!matchedValId) {
                throw new BadRequestException({
                  message: MESSAGES.PRODUCT.MISSING_ATTRIBUTE_IN_COMBINATION(dynConfig.attributeName),
                  errorCode: 'MISSING_ATTRIBUTE_IN_COMBINATION',
                });
              }
              const valData = dynConfig.valueMap.get(matchedValId)!;
              combinationValueCodes.push(valData.code);
            }

            const expectedSku = SkuGeneratorUtil.buildSku(productCode, combinationValueCodes);
            if (varInput.sku !== expectedSku) {
              throw new ConflictException({
                message: MESSAGES.PRODUCT.SKU_CONFLICT(expectedSku, varInput.sku),
                errorCode: 'SKU_CONFLICT',
              });
            }

            const combinationHash = [...valIds].sort().join(':');
            if (seenCombinationHashes.has(combinationHash)) {
              continue;
            }
            seenCombinationHashes.add(combinationHash);

            preparedVariants.push({
              sku: expectedSku,
              isDefault: false,
              combinationHash,
              dynamicValueIds: valIds,
            });
          }
        }

        if (preparedVariants.length === 0) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.NO_VARIANTS_REMAINING,
            errorCode: 'NO_VARIANTS_REMAINING',
          });
        }

        // Verify SKU uniqueness across tenant in database via ProductVariantRepository
        for (const pv of preparedVariants) {
          const existingSku = await this.productVariantRepository.findBySku(tenantId, pv.sku, manager);
          if (existingSku) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT.SKU_ALREADY_EXISTS_REFRESH(pv.sku),
              errorCode: 'SKU_ALREADY_EXISTS',
            });
          }
        }

        // 7. Persist Product via ProductRepository
        const product = this.productRepository.create(
          {
            tenantId,
            name: dto.name,
            code: productCode,
            description: dto.description || null,
            categoryId: dto.categoryId,
            brandId: dto.brandId || null,
            baseUomId: dto.baseUomId,
            status: dto.status ?? ProductStatus.ACTIVE,
            isPurchasable: dto.isPurchasable ?? true,
            isSellable: dto.isSellable ?? true,
            sku: preparedVariants[0]?.sku ?? null,
            isDeleted: false,
          },
          manager,
        );
        const savedProduct = await this.productRepository.save(product, manager);

        // 8. Persist Static Attribute Configs & Value Configs
        for (const st of staticConfigsToCreate) {
          const cfg = this.attributeConfigRepository.create(
            {
              tenantId,
              productId: savedProduct.id,
              attributeId: st.attributeId,
              type: ProductAttributeType.STATIC,
              orderIndex: 0,
            },
            manager,
          );
          const savedCfg = await this.attributeConfigRepository.save(cfg, manager);

          const valCfg = this.valueConfigRepository.create(
            {
              tenantId: savedCfg.tenantId,
              productId: savedCfg.productId,
              attributeConfigId: savedCfg.id,
              attributeValueId: st.staticValueId,
              code: null,
            },
            manager,
          );
          await this.valueConfigRepository.save(valCfg, manager);
        }

        // 9. Persist Dynamic Attribute Configs & Value Configs
        const dynamicConfigEntitiesMap = new Map<string, ProductAttributeConfig>();
        for (const dyn of dynamicConfigsToCreate) {
          const cfg = this.attributeConfigRepository.create(
            {
              tenantId,
              productId: savedProduct.id,
              attributeId: dyn.attributeId,
              type: ProductAttributeType.DYNAMIC,
              orderIndex: dyn.orderIndex,
            },
            manager,
          );
          const savedCfg = await this.attributeConfigRepository.save(cfg, manager);
          dynamicConfigEntitiesMap.set(dyn.attributeId, savedCfg);

          for (const [valId, valInfo] of dyn.valueMap.entries()) {
            const valCfg = this.valueConfigRepository.create(
              {
                tenantId: savedCfg.tenantId,
                productId: savedCfg.productId,
                attributeConfigId: savedCfg.id,
                attributeValueId: valId,
                code: valInfo.code,
              },
              manager,
            );
            await this.valueConfigRepository.save(valCfg, manager);
          }
        }

        // 10. Persist Variants and Variant Attribute Values
        for (const pv of preparedVariants) {
          const variantEntity = this.productVariantRepository.create(
            {
              tenantId,
              productId: savedProduct.id,
              sku: pv.sku,
              status: VariantStatus.ACTIVE,
              isDefault: pv.isDefault,
              combinationHash: pv.combinationHash,
            },
            manager,
          );
          const savedVariant = await this.productVariantRepository.save(variantEntity, manager);

          for (const valId of pv.dynamicValueIds) {
            const dynConfig = dynamicConfigsToCreate.find((d) => d.valueMap.has(valId));
            if (dynConfig) {
              const vav = this.variantValueRepository.create(
                {
                  tenantId,
                  variantId: savedVariant.id,
                  attributeId: dynConfig.attributeId,
                  attributeValueId: valId,
                },
                manager,
              );
              await this.variantValueRepository.save(vav, manager);
            }
          }
        }

        // Return full product details
        const reloaded = await this.productRepository.findByIdWithDetails(savedProduct.id, tenantId, manager);
        const paginatedVariants = await this.productVariantRepository.findPaginatedByProductId(
          tenantId,
          savedProduct.id,
          1,
          50,
          manager,
        );
        return ProductMapper.toDetailDto(reloaded!, {
          ...paginatedVariants,
          items: paginatedVariants.items.map((v) => ProductMapper.toVariantResponseDto(v)),
        });
      },
    );
  }

  async getProductsPaginated(
    query: ProductPaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<ProductListItemResponseDto>> {
    const tenantId = this.requireTenant(user);
    const { items, ...pagination } = await this.productRepository.findPaginated(tenantId, query);

    return {
      items: items.map((p) => ProductMapper.toListItemDto(p)),
      ...pagination,
    };
  }

  async getProductById(
    id: string,
    page: number = 1,
    pageSize: number = 10,
    user: ICurrentUserData,
  ): Promise<ProductDetailResponseDto> {
    const tenantId = this.requireTenant(user);
    const product = await this.productRepository.findByIdWithDetails(id, tenantId);
    if (!product) {
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    const paginatedVariants = await this.productVariantRepository.findPaginatedByProductId(
      tenantId,
      id,
      page,
      pageSize,
    );

    return ProductMapper.toDetailDto(product, {
      ...paginatedVariants,
      items: paginatedVariants.items.map((v) => ProductMapper.toVariantResponseDto(v)),
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto, user: ICurrentUserData): Promise<ProductDetailResponseDto> {
    const tenantId = this.requireTenant(user);

    if (
      dto.name === undefined &&
      dto.description === undefined &&
      dto.brandId === undefined &&
      dto.status === undefined &&
      dto.isPurchasable === undefined &&
      dto.isSellable === undefined &&
      dto.staticAttributeValues === undefined
    ) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT.NO_FIELDS_TO_UPDATE,
        errorCode: 'EMPTY_UPDATE',
      });
    }

    return this.dataSource.transaction<ProductDetailResponseDto>(
      'READ COMMITTED',
      async (manager: EntityManager): Promise<ProductDetailResponseDto> => {
        const product = await this.productRepository.findOne(
          { where: { id, tenantId }, lock: { mode: 'pessimistic_write' } },
          manager,
        );
        if (!product) {
          throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
        }

        if (dto.name !== undefined) {
          product.name = dto.name;
        }

        if (dto.description !== undefined) {
          product.description = dto.description;
        }

        if (dto.brandId !== undefined) {
          if (dto.brandId === null) {
            product.brandId = null;
          } else {
            const brand = await this.brandRepository.findOne(
              {
                where: { id: dto.brandId, tenantId },
              },
              manager,
            );
            if (!brand || brand.status !== BrandStatus.ACTIVE) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.BRAND_NOT_FOUND_OR_INACTIVE,
                errorCode: 'BRAND_INACTIVE_OR_NOT_FOUND',
              });
            }
            product.brandId = dto.brandId;
          }
        }

        if (dto.status !== undefined) {
          product.status = dto.status;
        }

        if (dto.isPurchasable !== undefined) {
          product.isPurchasable = dto.isPurchasable;
        }

        if (dto.isSellable !== undefined) {
          product.isSellable = dto.isSellable;
        }

        await this.productRepository.save(product, manager);

        // Update static attribute values if provided via AttributeConfig & ValueConfig Repositories
        if (dto.staticAttributeValues && dto.staticAttributeValues.length > 0) {
          for (const statUpdate of dto.staticAttributeValues) {
            const config = await this.attributeConfigRepository.findOne(
              {
                where: {
                  productId: product.id,
                  attributeId: statUpdate.attributeId,
                  type: ProductAttributeType.STATIC,
                },
              },
              manager,
            );
            if (!config) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.ATTRIBUTE_NOT_CONFIGURED_AS_STATIC(statUpdate.attributeId),
                errorCode: 'ATTRIBUTE_NOT_CONFIGURED_AS_STATIC',
              });
            }

            const val = await this.attributeValueRepository.findOne(
              {
                where: { id: statUpdate.valueId, attributeId: statUpdate.attributeId },
              },
              manager,
            );
            if (!val || val.status !== AttributeStatus.ACTIVE) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.STATIC_VALUE_NOT_FOUND_OR_INACTIVE(statUpdate.valueId),
                errorCode: 'ATTRIBUTE_VALUE_INACTIVE_OR_NOT_FOUND',
              });
            }

            let valConfig = await this.valueConfigRepository.findOne(
              {
                where: { attributeConfigId: config.id, tenantId },
              },
              manager,
            );
            if (!valConfig) {
              valConfig = this.valueConfigRepository.create(
                {
                  tenantId: config.tenantId,
                  productId: product.id,
                  attributeConfigId: config.id,
                  attributeValueId: val.id,
                  code: null,
                },
                manager,
              );
            } else {
              valConfig.attributeValueId = val.id;
            }
            await this.valueConfigRepository.save(valConfig, manager);
          }
        }

        const reloaded = await this.productRepository.findByIdWithDetails(product.id, tenantId, manager);
        const variants = await this.productVariantRepository.findPaginatedByProductId(
          tenantId,
          product.id,
          1,
          10,
          manager,
        );

        return ProductMapper.toDetailDto(reloaded!, {
          ...variants,
          items: variants.items.map((v) => ProductMapper.toVariantResponseDto(v)),
        });
      },
    );
  }

  async addVariants(id: string, dto: AddVariantsDto, user: ICurrentUserData): Promise<ProductDetailResponseDto> {
    const tenantId = this.requireTenant(user);

    return this.dataSource.transaction<ProductDetailResponseDto>(
      'READ COMMITTED',
      async (manager: EntityManager): Promise<ProductDetailResponseDto> => {
        const product = await this.productRepository.findByIdWithDetails(id, tenantId, manager);
        if (!product) {
          throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
        }

        const dynamicConfigs = (product.attributeConfigs || [])
          .filter((c) => c.type === ProductAttributeType.DYNAMIC)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        if (dynamicConfigs.length === 0) {
          throw new BadRequestException({
            message: MESSAGES.PRODUCT.NO_DYNAMIC_ATTRIBUTES_CONFIGURED,
            errorCode: 'PRODUCT_HAS_NO_DYNAMIC_ATTRIBUTES',
          });
        }

        const dynamicConfigByAttrId = new Map(dynamicConfigs.map((c) => [c.attributeId, c]));

        if (dto.newDynamicValues && dto.newDynamicValues.length > 0) {
          for (const newAssignment of dto.newDynamicValues) {
            const cfg = dynamicConfigByAttrId.get(newAssignment.attributeId);
            if (!cfg) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.ATTRIBUTE_NOT_DYNAMIC_FOR_PRODUCT(newAssignment.attributeId),
                errorCode: 'ATTRIBUTE_NOT_DYNAMIC_FOR_PRODUCT',
              });
            }

            const existingValCfg = (cfg.valueConfigs || []).find((d) => d.attributeValueId === newAssignment.valueId);
            if (!existingValCfg) {
              const val = await this.attributeValueRepository.findOne(
                {
                  where: { id: newAssignment.valueId, attributeId: newAssignment.attributeId },
                },
                manager,
              );
              if (!val || val.status !== AttributeStatus.ACTIVE) {
                throw new BadRequestException({
                  message: MESSAGES.PRODUCT.NEW_DYNAMIC_VALUE_NOT_FOUND_OR_INACTIVE(newAssignment.valueId),
                  errorCode: 'ATTRIBUTE_VALUE_INACTIVE_OR_NOT_FOUND',
                });
              }

              const existingCodes = new Set(
                (cfg.valueConfigs || []).map((d) => d.code).filter((c): c is string => Boolean(c)),
              );
              const code = SkuGeneratorUtil.generateValueCode(val.label, existingCodes);

              const createdValCfg = this.valueConfigRepository.create(
                {
                  tenantId: cfg.tenantId,
                  productId: product.id,
                  attributeConfigId: cfg.id,
                  attributeValueId: val.id,
                  code,
                },
                manager,
              );
              const savedValCfg = await this.valueConfigRepository.save(createdValCfg, manager);
              cfg.valueConfigs = [...(cfg.valueConfigs || []), savedValCfg];
            }
          }
        }

        const valueLookup = new Map<string, { attributeId: string; code: string }>();
        for (const cfg of dynamicConfigs) {
          for (const dvc of cfg.valueConfigs || []) {
            if (dvc.code) {
              valueLookup.set(dvc.attributeValueId, { attributeId: cfg.attributeId, code: dvc.code });
            }
          }
        }

        const existingVariants = await this.productVariantRepository.findByProductId(tenantId, product.id, manager);
        const existingByCombination = new Map<string, ProductVariant>();
        for (const v of existingVariants) {
          existingByCombination.set(v.combinationHash, v);
        }

        for (const varInput of dto.variants) {
          const valIds = varInput.dynamicValueIds || [];
          if (valIds.length !== dynamicConfigs.length) {
            throw new BadRequestException({
              message: MESSAGES.PRODUCT.INVALID_VARIANT_COMBINATION_VALUE_COUNT(dynamicConfigs.length),
              errorCode: 'INVALID_VARIANT_COMBINATION',
            });
          }

          const combinationCodes: string[] = [];
          for (const dynCfg of dynamicConfigs) {
            const matchedValId = valIds.find((id) => {
              const item = valueLookup.get(id);
              return item && item.attributeId === dynCfg.attributeId;
            });
            if (!matchedValId) {
              throw new BadRequestException({
                message: MESSAGES.PRODUCT.MISSING_ATTRIBUTE_IN_COMBINATION(
                  dynCfg.attribute?.name || dynCfg.attributeId,
                ),
                errorCode: 'MISSING_ATTRIBUTE_IN_COMBINATION',
              });
            }
            combinationCodes.push(valueLookup.get(matchedValId)!.code);
          }

          const expectedSku = SkuGeneratorUtil.buildSku(product.code, combinationCodes);
          if (varInput.sku !== expectedSku) {
            throw new ConflictException({
              message: MESSAGES.PRODUCT.SKU_CONFLICT(expectedSku, varInput.sku),
              errorCode: 'SKU_CONFLICT',
            });
          }

          const combinationHash = [...valIds].sort().join(':');
          const existingMatch = existingByCombination.get(combinationHash);

          if (existingMatch) {
            if (existingMatch.status === VariantStatus.INACTIVE) {
              existingMatch.status = VariantStatus.ACTIVE;
              await this.productVariantRepository.save(existingMatch, manager);
            } else {
              throw new ConflictException({
                message: MESSAGES.PRODUCT.VARIANT_COMBINATION_ALREADY_EXISTS(existingMatch.sku),
                errorCode: 'VARIANT_ALREADY_EXISTS',
              });
            }
          } else {
            const skuInUse = await this.productVariantRepository.findBySku(tenantId, expectedSku, manager);
            if (skuInUse) {
              throw new ConflictException({
                message: MESSAGES.PRODUCT.SKU_ALREADY_EXISTS(expectedSku),
                errorCode: 'SKU_ALREADY_EXISTS',
              });
            }

            const newVariant = this.productVariantRepository.create(
              {
                tenantId,
                productId: product.id,
                sku: expectedSku,
                status: VariantStatus.ACTIVE,
                isDefault: false,
                combinationHash,
              },
              manager,
            );
            const savedVariant = await this.productVariantRepository.save(newVariant, manager);

            for (const valId of valIds) {
              const lookup = valueLookup.get(valId)!;
              const vav = this.variantValueRepository.create(
                {
                  tenantId,
                  variantId: savedVariant.id,
                  attributeId: lookup.attributeId,
                  attributeValueId: valId,
                },
                manager,
              );
              await this.variantValueRepository.save(vav, manager);
            }
          }
        }

        const reloaded = await this.productRepository.findByIdWithDetails(product.id, tenantId, manager);
        const variants = await this.productVariantRepository.findPaginatedByProductId(
          tenantId,
          product.id,
          1,
          10,
          manager,
        );

        return ProductMapper.toDetailDto(reloaded!, {
          ...variants,
          items: variants.items.map((v) => ProductMapper.toVariantResponseDto(v)),
        });
      },
    );
  }

  async updateVariantStatus(
    productId: string,
    variantId: string,
    dto: UpdateVariantStatusDto,
    user: ICurrentUserData,
  ): Promise<ProductVariantResponseDto> {
    const tenantId = this.requireTenant(user);

    return this.dataSource.transaction<ProductVariantResponseDto>(
      'READ COMMITTED',
      async (manager: EntityManager): Promise<ProductVariantResponseDto> => {
        const variant = await this.productVariantRepository.findOne(
          {
            where: { id: variantId, productId, tenantId },
            relations: {
              variantAttributeValues: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
          manager,
        );

        if (!variant) {
          throw new NotFoundException(MESSAGES.PRODUCT.VARIANT_NOT_FOUND);
        }

        variant.status = dto.status;
        const saved = await this.productVariantRepository.save(variant, manager);

        const configValues = await this.valueConfigRepository.findCodesByProductId(productId, tenantId, manager);
        const codeMap = new Map(
          configValues.filter((cv) => Boolean(cv.code)).map((cv) => [cv.attributeValueId, cv.code!]),
        );

        return ProductMapper.toVariantResponseDto(saved, codeMap);
      },
    );
  }

  async deleteVariant(productId: string, variantId: string, user: ICurrentUserData): Promise<void> {
    const tenantId = this.requireTenant(user);

    await this.dataSource.transaction<void>('READ COMMITTED', async (manager: EntityManager): Promise<void> => {
      const variant = await this.productVariantRepository.findOne(
        {
          where: { id: variantId, productId, tenantId },
        },
        manager,
      );

      if (!variant) {
        throw new NotFoundException(MESSAGES.PRODUCT.VARIANT_NOT_FOUND);
      }

      // Prevent deleting the last variant of a product
      const totalCount = await this.productVariantRepository.countByProductId(tenantId, productId, manager);
      if (totalCount <= 1) {
        throw new ConflictException({
          message: MESSAGES.PRODUCT.LAST_VARIANT_DELETE_BLOCKED,
          errorCode: 'CANNOT_DELETE_LAST_VARIANT',
        });
      }

      // Allow permanent variant deletion only when never referenced by external tables
      const referencesExist = await this.productVariantRepository.hasExternalReferences(variantId, manager);
      if (referencesExist) {
        throw new ConflictException({
          message: MESSAGES.PRODUCT.VARIANT_DELETE_BLOCKED_REFERENCED,
          errorCode: 'VARIANT_REFERENCED_CANNOT_DELETE',
        });
      }

      // Safe to delete via repositories
      try {
        await this.variantValueRepository.deleteByVariantId(variant.id, manager);
        await this.productVariantRepository.delete({ id: variant.id, tenantId }, manager);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23503') {
          throw new ConflictException({
            message: MESSAGES.PRODUCT.VARIANT_DELETE_BLOCKED_REFERENCED,
            errorCode: 'VARIANT_REFERENCED_CANNOT_DELETE',
          });
        }
        throw err;
      }
    });
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
