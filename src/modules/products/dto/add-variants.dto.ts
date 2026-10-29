import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariantInputDto } from './create-product.dto';

export class NewDynamicValueAssignmentDto {
  @IsUUID('4', { message: 'attributeId must be a valid UUID' })
  @IsNotEmpty({ message: 'attributeId is required' })
  attributeId!: string;

  @IsUUID('4', { message: 'valueId must be a valid UUID' })
  @IsNotEmpty({ message: 'valueId is required' })
  valueId!: string;
}

export class AddVariantsDto {
  @IsOptional()
  @IsArray({ message: 'newDynamicValues must be an array' })
  @ValidateNested({ each: true })
  @Type(() => NewDynamicValueAssignmentDto)
  newDynamicValues?: NewDynamicValueAssignmentDto[];

  @IsArray({ message: 'variants must be an array' })
  @ArrayMinSize(1, { message: 'At least one variant must be supplied to save' })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants!: ProductVariantInputDto[];
}
