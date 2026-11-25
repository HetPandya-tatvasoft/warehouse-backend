import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ProductStatus } from '../enums/product.enums';

export class ProductPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  categoryId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  brandId?: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'status must be ACTIVE or INACTIVE' })
  status?: ProductStatus;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'status', 'code'], {
    message: 'sortBy must be one of: name, createdAt, status, code',
  })
  sortBy?: 'name' | 'createdAt' | 'status' | 'code' = 'createdAt';
}
