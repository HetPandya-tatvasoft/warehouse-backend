import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BrandStatus } from '../../enums/brand-status.enum';

export class UpsertBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsEnum(BrandStatus)
  status?: BrandStatus;
}
