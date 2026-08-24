import type { ProductCategoryStatus } from '../../enums/categoryStatus.enum';

export class CategoryResponseDto {
  id!: string;
  tenantId!: string;
  parentId!: string | null;
  name!: string;
  description!: string | null;
  status!: ProductCategoryStatus;
  createdAt!: Date;
  updatedAt!: Date;
  children?: CategoryResponseDto[];
}
