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
import { ProductStatus } from '../enums/product.enums';
import { ProductAttributeInputDto } from './product-attribute-input.dto';
import { ProductVariantInputDto } from './product-variant-input.dto';

export { ProductAttributeInputDto, ProductVariantInputDto };

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
