import type { BrandStatus } from '../../enums/brand-status.enum';

export class BrandResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  status!: BrandStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
