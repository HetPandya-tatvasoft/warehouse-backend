import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, IsInt } from 'class-validator';
import { BranchStatus } from '../enums/branch-status.enum';

export class UpdateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsEnum(BranchStatus)
  status!: BranchStatus;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine2?: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  cityId!: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  stateId!: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  countryId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  postalCode!: string;
}
