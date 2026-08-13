import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WarehouseContactUpsertDto } from './create-warehouse.dto';

export class UpdateWarehouseContactsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Every warehouse must have at least one contact' })
  @ValidateNested({ each: true })
  @Type(() => WarehouseContactUpsertDto)
  contacts!: WarehouseContactUpsertDto[];
}
