import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class StateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;
}

export class CityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stateId?: number;
}
