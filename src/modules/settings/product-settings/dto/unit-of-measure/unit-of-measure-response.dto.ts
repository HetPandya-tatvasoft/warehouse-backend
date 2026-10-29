import type { UnitOfMeasureStatus } from '../../enums/unit-of-measure-status.enum';

export class UnitOfMeasureResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  code!: string;
  allowsFractionalQuantity!: boolean;
  status!: UnitOfMeasureStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
