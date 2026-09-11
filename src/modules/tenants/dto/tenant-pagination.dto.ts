import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { TenantStatus } from '../enums/tenant-status.enum';

export class TenantPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  //* add in const later
  @IsIn(['name', 'companyEmail', 'status', 'createdAt'])
  sortBy?: 'name' | 'companyEmail' | 'status' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(Object.values(TenantStatus))
  status?: TenantStatus;
}
