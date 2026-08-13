import type { Warehouse } from '../entities/warehouse.entity';
import { WarehouseResponseDto } from '../dto/warehouse-response.dto';

export class WarehouseMapper {
  static toResponseDto(warehouse: Warehouse): WarehouseResponseDto {
    const dto = new WarehouseResponseDto();
    dto.id = warehouse.id;
    dto.branchId = warehouse.branchId;
    dto.addressId = warehouse.addressId;
    dto.name = warehouse.name;
    dto.code = warehouse.code;
    dto.status = warehouse.status;
    dto.isDefault = warehouse.isDefault;
    dto.createdAt = warehouse.createdAt;
    dto.updatedAt = warehouse.updatedAt;

    if (warehouse.address) {
      // you can create dedicated mappers for this nested things too
      dto.address = {
        id: warehouse.address.id,
        addressLine1: warehouse.address.addressLine1,
        addressLine2: warehouse.address.addressLine2,
        countryId: Number(warehouse.address.countryId),
        stateId: Number(warehouse.address.stateId),
        cityId: Number(warehouse.address.cityId),
        postalCode: warehouse.address.postalCode,
      };
    }

    if (warehouse.branch) {
      dto.branch = {
        id: warehouse.branch.id,
        name: warehouse.branch.name,
      };
    }

    if (warehouse.contacts) {
      dto.contacts = warehouse.contacts.map((wc) => ({
        id: wc.contactId,
        userId: wc.contact?.userId,
        fullName: wc.contact?.fullName || '',
        email: wc.contact?.email,
        phone: wc.contact?.phone || '',
        isDefault: wc.isDefault,
      }));
    }

    return dto;
  }
}
