import {
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
import { UpdateStaticAttributeValueDto } from './update-static-attribute-value.dto';

export { UpdateStaticAttributeValueDto };

export class UpdateProductDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty if provided' })
  @MaxLength(150, { message: 'name cannot exceed 150 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'brandId must be a valid UUID' })
  brandId?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'status must be ACTIVE or INACTIVE' })
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean({ message: 'isPurchasable must be a boolean' })
  isPurchasable?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isSellable must be a boolean' })
  isSellable?: boolean;

  @IsOptional()
  @IsArray({ message: 'staticAttributeValues must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateStaticAttributeValueDto)
  staticAttributeValues?: UpdateStaticAttributeValueDto[];
}
