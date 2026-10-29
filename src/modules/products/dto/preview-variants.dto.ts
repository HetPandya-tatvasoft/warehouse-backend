import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductAttributeInputDto } from './create-product.dto';

export class PreviewVariantsDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(150, { message: 'name cannot exceed 150 characters' })
  name!: string;

  @IsOptional()
  @IsArray({ message: 'attributes must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];

  @IsOptional()
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId?: string;
}
