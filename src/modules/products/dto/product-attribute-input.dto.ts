import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ProductAttributeType } from '../enums/product.enums';

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
