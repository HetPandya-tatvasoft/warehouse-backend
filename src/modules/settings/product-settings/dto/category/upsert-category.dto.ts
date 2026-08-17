import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductCategoryStatus } from '../../enums/categoryStatus.enum';

export class UpsertCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
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
}
