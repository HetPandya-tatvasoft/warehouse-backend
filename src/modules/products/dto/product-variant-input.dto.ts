import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ProductVariantInputDto {
  @IsString({ message: 'sku must be a string' })
  @IsNotEmpty({ message: 'sku is required' })
  @MaxLength(100, { message: 'sku cannot exceed 100 characters' })
  sku!: string;

  @IsOptional()
  @IsArray({ message: 'dynamicValueIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each dynamicValueId must be a valid UUID' })
  dynamicValueIds?: string[];
}
