import type { AttributeStatus } from '../../enums/attribute-status.enum';

export class AttributeValueResponseDto {
  id!: string;
  attributeId!: string;
  label!: string;
  status!: AttributeStatus;
  createdAt!: Date;
  updatedAt!: Date;
  isAvailableForSelection!: boolean;
}
