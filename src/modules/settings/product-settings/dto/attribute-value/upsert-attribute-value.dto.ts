import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AttributeStatus } from '../../enums/attribute-status.enum';

export class UpsertAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  label!: string;

  @IsOptional()
  @IsEnum(AttributeStatus)
  status?: AttributeStatus = AttributeStatus.ACTIVE;
}
