import { ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariantInputDto } from './product-variant-input.dto';
import { NewDynamicValueAssignmentDto } from './new-dynamic-value-assignment.dto';

export { NewDynamicValueAssignmentDto };

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
