import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { BranchStatus } from '../enums/branch-status.enum';

export class BranchPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'status', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
