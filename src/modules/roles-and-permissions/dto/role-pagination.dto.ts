import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class RolePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;
}
