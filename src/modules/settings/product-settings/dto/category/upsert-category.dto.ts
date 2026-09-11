import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProductCategoryStatus } from '../../enums/categoryStatus.enum';
import { VALIDATION_MESSAGES } from '@/common/constants/messages.constants';

export class UpsertCategoryDto {
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PRODUCT_CATEGORY.NAME_REQUIRED })
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsEnum(ProductCategoryStatus)
  status?: ProductCategoryStatus = ProductCategoryStatus.ACTIVE;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
}
