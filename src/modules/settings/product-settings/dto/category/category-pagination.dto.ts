import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ProductCategoryStatus } from '../../enums/categoryStatus.enum';

export class CategoryPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'status', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductCategoryStatus)
  status?: ProductCategoryStatus;
}
