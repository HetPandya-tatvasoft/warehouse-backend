import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UnitOfMeasureStatus } from '../../enums/unit-of-measure-status.enum';

export class UpsertUnitOfMeasureDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  code!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  allowsFractionalQuantity!: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(UnitOfMeasureStatus)
  status?: UnitOfMeasureStatus;
}
