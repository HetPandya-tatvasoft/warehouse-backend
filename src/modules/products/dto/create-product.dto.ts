import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductAttributeType, ProductStatus } from '../enums/product.enums';

export class ProductAttributeInputDto {
  @IsUUID('4', { message: 'attributeId must be a valid UUID' })
  @IsNotEmpty({ message: 'attributeId is required' })
  attributeId!: string;

  @IsEnum(ProductAttributeType, { message: 'type must be STATIC or DYNAMIC' })
  @IsNotEmpty({ message: 'type is required' })
  type!: ProductAttributeType;

  @IsOptional()
  @IsUUID('4', { message: 'staticValueId must be a valid UUID' })
  staticValueId?: string;

  @IsOptional()
  @IsArray({ message: 'dynamicValueIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each dynamicValueId must be a valid UUID' })
  dynamicValueIds?: string[];
}

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

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(150, { message: 'name cannot exceed 150 characters' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string | null;

  @IsUUID('4', { message: 'categoryId must be a valid UUID' })
  @IsNotEmpty({ message: 'categoryId is required' })
  categoryId!: string;

  @IsOptional()
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  brandId?: string | null;

  @IsUUID('4', { message: 'baseUomId must be a valid UUID' })
  @IsNotEmpty({ message: 'baseUomId is required' })
  baseUomId!: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'status must be ACTIVE or INACTIVE' })
  status?: ProductStatus = ProductStatus.ACTIVE;

  @IsOptional()
  @IsBoolean({ message: 'isPurchasable must be a boolean' })
  isPurchasable?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'isSellable must be a boolean' })
  isSellable?: boolean = true;

  @IsOptional()
  @IsArray({ message: 'attributes must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsArray({ message: 'variants must be an array' })
  @ArrayMinSize(1, { message: 'At least one variant is required' })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants!: ProductVariantInputDto[];
}
