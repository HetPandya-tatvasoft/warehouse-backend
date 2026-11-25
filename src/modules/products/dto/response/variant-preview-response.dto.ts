import type { ProductDynamicAttributeDetailDto, VariantCombinationValueDto } from './product-response.dto';

export class CandidateVariantPreviewDto {
  sku!: string;
  isDefault!: boolean;
  dynamicValueIds!: string[];
  values!: VariantCombinationValueDto[];
}

export class VariantPreviewResponseDto {
  productCode!: string;
  dynamicAttributes!: ProductDynamicAttributeDetailDto[];
  variants!: CandidateVariantPreviewDto[];
  totalCombinations!: number;
}
