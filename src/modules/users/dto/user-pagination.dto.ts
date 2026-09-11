import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class UserPaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'])
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  search?: string;
}
