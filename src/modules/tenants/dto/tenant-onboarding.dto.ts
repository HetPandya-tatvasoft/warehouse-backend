import { Type, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested, IsInt } from 'class-validator';
import { VALIDATION_MESSAGES } from '@/common/constants/messages.constants';

export class PrimaryAdministratorDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;
}

export class TenantOnboardingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: VALIDATION_MESSAGES.TENANT.SLUG_FORMAT,
  })
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  slug!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  companyEmail!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  companyPhone!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  addressLine2?: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  cityId!: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  stateId!: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  countryId!: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  timezone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  branchName!: string;

  @ValidateNested()
  @Type(() => PrimaryAdministratorDto)
  primaryAdministrator!: PrimaryAdministratorDto;
}
