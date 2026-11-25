import { IsEnum, IsNotEmpty } from 'class-validator';
import { VariantStatus } from '../enums/product.enums';

export class UpdateVariantStatusDto {
  @IsEnum(VariantStatus, { message: 'status must be ACTIVE or INACTIVE' })
  @IsNotEmpty({ message: 'status is required' })
  status!: VariantStatus;
}
