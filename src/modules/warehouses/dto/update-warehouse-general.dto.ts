import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WarehouseStatus } from '../enums/warehouse-status.enum';

export class UpdateWarehouseGeneralDto {
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
}
