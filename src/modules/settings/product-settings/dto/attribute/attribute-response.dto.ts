import type { AttributeStatus } from '../../enums/attribute-status.enum';

export class AttributeResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  status!: AttributeStatus;
  createdAt!: Date;
  updatedAt!: Date;
  valueCount!: number;
}
