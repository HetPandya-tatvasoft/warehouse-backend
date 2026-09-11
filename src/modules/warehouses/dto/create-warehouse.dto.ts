import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { WarehouseStatus } from '../enums/warehouse-status.enum';

export class WarehouseContactUpsertDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  fullName!: string;

  @IsNotEmpty({ message: 'Contact email is required' })
  @IsEmail({}, { message: 'Invalid contact email' })
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsBoolean()
  isDefault!: boolean;
}

export class CreateWarehouseDto {
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  code!: string;

  @IsEnum(WarehouseStatus)
  status!: WarehouseStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsArray()
  @ArrayMinSize(1, { message: 'Every warehouse must have at least one contact' })
  @ValidateNested({ each: true })
  @Type(() => WarehouseContactUpsertDto)
  contacts!: WarehouseContactUpsertDto[];
}
