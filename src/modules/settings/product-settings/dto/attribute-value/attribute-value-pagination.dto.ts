import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { AttributeStatus } from '../../enums/attribute-status.enum';

export class AttributeValuePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['label', 'status', 'createdAt', 'updatedAt'])
  sortBy?: 'label' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AttributeStatus)
  status?: AttributeStatus;
}
