import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { WarehouseStatus } from '../enums/warehouse-status.enum';

export class WarehousePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'code', 'status', 'isDefault', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'code' | 'status' | 'isDefault' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(WarehouseStatus)
  status?: WarehouseStatus;
}
