import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { UnitOfMeasureStatus } from '../../enums/unit-of-measure-status.enum';

export class UnitOfMeasurePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UnitOfMeasureStatus)
  status?: UnitOfMeasureStatus;

  @IsOptional()
  @IsIn(['name', 'code', 'createdAt'])
  sortBy?: 'name' | 'code' | 'createdAt' = 'createdAt';
}
