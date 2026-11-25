import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import type { Product } from '../entities/product.entity';
import type { ProductVariant } from '../entities/product-variant.entity';
import { ProductAttributeType } from '../enums/product.enums';
import type {
  ProductDetailResponseDto,
  ProductDynamicAttributeDetailDto,
  ProductListItemResponseDto,
  ProductStaticAttributeDetailDto,
  ProductVariantResponseDto,
} from '../dto/response/product-response.dto';

export class ProductMapper {
  static toListItemDto(product: Product): ProductListItemResponseDto {
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      status: product.status,
      isPurchasable: product.isPurchasable,
      isSellable: product.isSellable,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? '',
      brandId: product.brandId,
      brandName: product.brand?.name ?? null,
      baseUomId: product.baseUomId,
      baseUomName: product.baseUom?.name ?? '',
      baseUomCode: product.baseUom?.code ?? '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toVariantResponseDto(variant: ProductVariant, codeMap?: Map<string, string>): ProductVariantResponseDto {
    const values = (variant.variantAttributeValues || []).map((vav) => ({
      attributeId: vav.attributeId,
      attributeName: vav.attribute?.name ?? '',
      valueId: vav.attributeValueId,
      valueLabel: vav.attributeValue?.label ?? '',
      code: codeMap?.get(vav.attributeValueId) ?? '',
    }));

    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      status: variant.status,
      isDefault: variant.isDefault,
      values,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  static toDetailDto(
    product: Product,
    variants: IPaginatedResponse<ProductVariantResponseDto>,
  ): ProductDetailResponseDto {
    const base = this.toListItemDto(product);

    const staticAttributes: ProductStaticAttributeDetailDto[] = [];
    const dynamicAttributes: ProductDynamicAttributeDetailDto[] = [];

    const configs = product.attributeConfigs || [];
    for (const config of configs) {
      if (config.type === ProductAttributeType.STATIC) {
        const singleVal = config.valueConfigs?.[0];
        staticAttributes.push({
          attributeId: config.attributeId,
          attributeName: config.attribute?.name ?? '',
          valueId: singleVal?.attributeValueId ?? '',
          valueLabel: singleVal?.attributeValue?.label ?? '',
        });
      } else if (config.type === ProductAttributeType.DYNAMIC) {
        dynamicAttributes.push({
          attributeId: config.attributeId,
          attributeName: config.attribute?.name ?? '',
          orderIndex: config.orderIndex,
          values: (config.valueConfigs || []).map((vc) => ({
            valueId: vc.attributeValueId,
            label: vc.attributeValue?.label ?? '',
            code: vc.code ?? '',
          })),
        });
      }
    }

    dynamicAttributes.sort((a, b) => a.orderIndex - b.orderIndex);

    // Populate codes in variant values from dynamic attribute value configs
    const codeMap = new Map<string, string>();
    for (const dyn of dynamicAttributes) {
      for (const val of dyn.values) {
        codeMap.set(val.valueId, val.code);
      }
    }

    for (const variantItem of variants.items) {
      for (const val of variantItem.values) {
        val.code = codeMap.get(val.valueId) ?? '';
      }
    }

    return {
      ...base,
      staticAttributes,
      dynamicAttributes,
      variants,
    };
  }
}
