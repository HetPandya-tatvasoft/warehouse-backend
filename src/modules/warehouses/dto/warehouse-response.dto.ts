import type { WarehouseStatus } from '../enums/warehouse-status.enum';

export class WarehouseResponseDto {
  id!: string;
  branchId!: string;
  addressId!: string;
  name!: string;
  code!: string;
  status!: WarehouseStatus;
  isDefault!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  address?: {
    id: string;
    addressLine1: string;
    addressLine2?: string;
    countryId: number;
    stateId: number;
    cityId: number;
    postalCode: string;
  };

  branch?: {
    id: string;
    name: string;
  };

  contacts?: {
    id: string;
    userId?: string | null;
    fullName: string;
    email?: string | null;
    phone: string;
    isDefault: boolean;
  }[];
}
