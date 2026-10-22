import type { AttributeStatus } from '../../enums/attribute-status.enum';

export type CategoryAssignmentType = 'DIRECT' | 'INHERITED';

export class CategoryAttributeResponseDto {
  id!: string;
  name!: string;
  status!: AttributeStatus;
  isSelectable!: boolean;
  valueCount!: number;
  assignmentType!: CategoryAssignmentType;
  sourceCategoryId!: string;
  sourceCategoryName!: string;
  assignedAt!: Date;
}
