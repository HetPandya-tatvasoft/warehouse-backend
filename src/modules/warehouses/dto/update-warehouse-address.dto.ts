import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWarehouseAddressDto {
  @IsNotEmpty({ message: 'Address Line 1 is required' })
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine2?: string;

  @IsNotEmpty({ message: 'City is required' })
  @IsInt()
  @Type(() => Number)
  cityId!: number;

  @IsNotEmpty({ message: 'State is required' })
  @IsInt()
  @Type(() => Number)
  stateId!: number;

  @IsNotEmpty({ message: 'Country is required' })
  @IsInt()
  @Type(() => Number)
  countryId!: number;

  @IsNotEmpty({ message: 'Postal Code is required' })
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  postalCode!: string;
}
