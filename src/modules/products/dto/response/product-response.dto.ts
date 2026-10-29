import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import type { ProductStatus, VariantStatus } from '../../enums/product.enums';

export class VariantCombinationValueDto {
  attributeId!: string;
  attributeName!: string;
  valueId!: string;
  valueLabel!: string;
  code!: string;
}

export class ProductVariantResponseDto {
  id!: string;
  productId!: string;
  sku!: string;
  status!: VariantStatus;
  isDefault!: boolean;
  values!: VariantCombinationValueDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class ProductStaticAttributeDetailDto {
  attributeId!: string;
  attributeName!: string;
  valueId!: string;
  valueLabel!: string;
}

export class ProductDynamicAttributeValueDetailDto {
  valueId!: string;
  label!: string;
  code!: string;
}

export class ProductDynamicAttributeDetailDto {
  attributeId!: string;
  attributeName!: string;
  orderIndex!: number;
  values!: ProductDynamicAttributeValueDetailDto[];
}

export class ProductListItemResponseDto {
  id!: string;
  name!: string;
  code!: string;
  description!: string | null;
  status!: ProductStatus;
  isPurchasable!: boolean;
  isSellable!: boolean;
  categoryId!: string;
  categoryName!: string;
  brandId!: string | null;
  brandName!: string | null;
  baseUomId!: string;
  baseUomName!: string;
  baseUomCode!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ProductDetailResponseDto extends ProductListItemResponseDto {
  staticAttributes!: ProductStaticAttributeDetailDto[];
  dynamicAttributes!: ProductDynamicAttributeDetailDto[];
  variants!: IPaginatedResponse<ProductVariantResponseDto>;
}
