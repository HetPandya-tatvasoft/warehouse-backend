import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { AttributeStatus } from '../../enums/attribute-status.enum';

export class AttributePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'status', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AttributeStatus)
  status?: AttributeStatus;
}
