import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, FindOptionsWhere, ILike, In } from 'typeorm';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { Warehouse } from '../entities/warehouse.entity';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ContactRepository } from '../repositories/contact.repository';
import { WarehouseContactRepository } from '../repositories/warehouse-contact.repository';
import { TenantBranchRepository } from '../../branches/repositories/tenant-branch.repository';
import { UserBranchRepository } from '../../branches/repositories/user-branch.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { AddressService } from '../../../common/services/address.service';
import { CreateWarehouseDto, WarehouseContactUpsertDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseGeneralDto } from '../dto/update-warehouse-general.dto';
import { UpdateWarehouseAddressDto } from '../dto/update-warehouse-address.dto';
import { UpdateWarehouseContactsDto } from '../dto/update-warehouse-contacts.dto';
import { WarehousePaginationQueryDto } from '../dto/warehouse-pagination.dto';
import { WarehouseResponseDto } from '../dto/warehouse-response.dto';
import { WarehouseMapper } from '../mappers/warehouse.mapper';
import { BranchStatus } from '../../branches/enums/branch-status.enum';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly contactRepository: ContactRepository,
    private readonly warehouseContactRepository: WarehouseContactRepository,
    private readonly tenantBranchRepository: TenantBranchRepository,
    private readonly userRepository: UserRepository,
    private readonly addressService: AddressService,
    private readonly dataSource: DataSource,
    private readonly userBranchRepository: UserBranchRepository,
  ) {}

  private async validateCommon(
    dto: CreateWarehouseDto,
    currentUser: ICurrentUserData,
    activeBranchId: string,
    warehouseId?: string,
  ): Promise<void> {
    const branch = await this.tenantBranchRepository.findOne({
      where: { id: activeBranchId, isDeleted: false },
    });
    if (!branch) {
      throw new NotFoundException(MESSAGES.WAREHOUSE.BRANCH_NOT_FOUND);
    }
    if (branch.status !== BranchStatus.ACTIVE) {
      throw new BadRequestException(MESSAGES.WAREHOUSE.BRANCH_INACTIVE);
    }
    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.ACCESS_DENIED);
    }

    const isAssigned = await this.userBranchRepository.findOne({
      where: { userId: currentUser.userId, branchId: activeBranchId },
    });
    if (!isAssigned) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.BRANCH_ACCESS_DENIED);
    }

    const duplicate = await this.warehouseRepository.findOne({
      where: [
        { branchId: activeBranchId, name: dto.name },
        { branchId: activeBranchId, code: dto.code },
      ],
    });
    if (duplicate && duplicate.id !== warehouseId) {
      if (duplicate.name === dto.name) {
        throw new ConflictException(MESSAGES.WAREHOUSE.NAME_EXISTS);
      }
      throw new ConflictException(MESSAGES.WAREHOUSE.CODE_EXISTS);
    }

    if (dto.isDefault) {
      const defaultWarehouse = await this.warehouseRepository.findOne({
        where: { branchId: activeBranchId, isDefault: true },
      });
      if (defaultWarehouse && defaultWarehouse.id !== warehouseId) {
        throw new ConflictException(MESSAGES.WAREHOUSE.MULTIPLE_DEFAULT_WAREHOUSES);
      }
    }

    await this.validateContactsPayload(dto.contacts);
  }

  async createWarehouse(
    dto: CreateWarehouseDto,
    currentUser: ICurrentUserData,
    activeBranchId: string,
  ): Promise<WarehouseResponseDto> {
    await this.validateCommon(dto, currentUser, activeBranchId);

    const savedWarehouse = await this.dataSource.transaction(async (manager) => {
      // Create and save address
      const address = await this.addressService.createAddress(
        {
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          countryId: dto.countryId,
          stateId: dto.stateId,
          cityId: dto.cityId,
          postalCode: dto.postalCode,
        },
        manager,
      );

      // Create and save warehouse
      const warehouseInstance = this.warehouseRepository.create(
        {
          branchId: activeBranchId,
          addressId: address.id,
          name: dto.name,
          code: dto.code,
          status: dto.status,
          isDefault: dto.isDefault || false,
        },
        manager,
      );
      const warehouse = await this.warehouseRepository.save(warehouseInstance, manager);

      // Save contacts and mappings
      for (const contactDto of dto.contacts) {
        const contactInstance = this.contactRepository.create(
          {
            userId: contactDto.userId,
            fullName: contactDto.fullName,
            email: contactDto.email,
            phone: contactDto.phone,
          },
          manager,
        );
        const contact = await this.contactRepository.save(contactInstance, manager);

        const mappingInstance = this.warehouseContactRepository.create(
          {
            warehouseId: warehouse.id,
            contactId: contact.id,
            isDefault: contactDto.isDefault,
          },
          manager,
        );
        await this.warehouseContactRepository.save(mappingInstance, manager);
      }

      // Reload with relations
      return (await this.warehouseRepository.findOne(
        {
          where: { id: warehouse.id, branchId: activeBranchId },
          relations: { address: true, branch: true, contacts: { contact: true } },
        },
        manager,
      ))!;
    });

    return WarehouseMapper.toResponseDto(savedWarehouse);
  }

  async findWarehouseForUpdate(id: string, currentUser: ICurrentUserData, activeBranchId: string): Promise<Warehouse> {
    const existingWarehouse = await this.warehouseRepository.findOne({
      where: { id, branchId: activeBranchId },
      relations: { branch: true },
    });
    if (!existingWarehouse) {
      throw new NotFoundException(MESSAGES.WAREHOUSE.NOT_FOUND);
    }
    if (existingWarehouse.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.ACCESS_DENIED);
    }

    const branch = await this.tenantBranchRepository.findOne({
      where: { id: activeBranchId, isDeleted: false },
    });
    if (!branch) {
      throw new NotFoundException(MESSAGES.WAREHOUSE.BRANCH_NOT_FOUND);
    }
    if (branch.status !== BranchStatus.ACTIVE) {
      throw new BadRequestException(MESSAGES.WAREHOUSE.BRANCH_INACTIVE);
    }
    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.ACCESS_DENIED);
    }

    // Validate user has access to active branch
    const isAssigned = await this.userBranchRepository.findOne({
      where: { userId: currentUser.userId, branchId: activeBranchId },
    });
    if (!isAssigned) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.BRANCH_ACCESS_DENIED);
    }

    return existingWarehouse;
  }

  async updateGeneral(
    id: string,
    dto: UpdateWarehouseGeneralDto,
    currentUser: ICurrentUserData,
    activeBranchId: string,
  ): Promise<WarehouseResponseDto> {
    await this.findWarehouseForUpdate(id, currentUser, activeBranchId);

    const duplicate = await this.warehouseRepository.findOne({
      where: [
        { branchId: activeBranchId, name: dto.name },
        { branchId: activeBranchId, code: dto.code },
      ],
    });
    if (duplicate && duplicate.id !== id) {
      if (duplicate.name === dto.name) {
        throw new ConflictException(MESSAGES.WAREHOUSE.NAME_EXISTS);
      }
      throw new ConflictException(MESSAGES.WAREHOUSE.CODE_EXISTS);
    }

    if (dto.isDefault) {
      const defaultWarehouse = await this.warehouseRepository.findOne({
        where: { branchId: activeBranchId, isDefault: true },
      });
      if (defaultWarehouse && defaultWarehouse.id !== id) {
        throw new ConflictException(MESSAGES.WAREHOUSE.MULTIPLE_DEFAULT_WAREHOUSES);
      }
    }

    const savedWarehouse = await this.dataSource.transaction(async (manager) => {
      await this.warehouseRepository.update(
        { id, branchId: activeBranchId },
        {
          name: dto.name,
          code: dto.code,
          status: dto.status,
          isDefault: dto.isDefault || false,
        },
        manager,
      );

      return (await this.warehouseRepository.findOne(
        {
          where: { id, branchId: activeBranchId },
          relations: { address: true, branch: true, contacts: { contact: true } },
        },
        manager,
      ))!;
    });

    return WarehouseMapper.toResponseDto(savedWarehouse);
  }

  async updateAddress(
    id: string,
    dto: UpdateWarehouseAddressDto,
    currentUser: ICurrentUserData,
    activeBranchId: string,
  ): Promise<WarehouseResponseDto> {
    const existingWarehouse = await this.findWarehouseForUpdate(id, currentUser, activeBranchId);

    const savedWarehouse = await this.dataSource.transaction(async (manager) => {
      await this.addressService.updateAddress(
        existingWarehouse.addressId,
        {
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          countryId: dto.countryId,
          stateId: dto.stateId,
          cityId: dto.cityId,
          postalCode: dto.postalCode,
        },
        manager,
      );

      return (await this.warehouseRepository.findOne(
        {
          where: { id, branchId: activeBranchId },
          relations: { address: true, branch: true, contacts: { contact: true } },
        },
        manager,
      ))!;
    });

    return WarehouseMapper.toResponseDto(savedWarehouse);
  }

  async updateContacts(
    id: string,
    dto: UpdateWarehouseContactsDto,
    currentUser: ICurrentUserData,
    activeBranchId: string,
  ): Promise<WarehouseResponseDto> {
    await this.findWarehouseForUpdate(id, currentUser, activeBranchId);

    await this.validateContactsPayload(dto.contacts);

    const savedWarehouse = await this.dataSource.transaction(async (manager) => {
      const existingMappings = await this.warehouseContactRepository.find(
        {
          where: { warehouseId: id },
        },
        manager,
      );

      const incomingContactIds = dto.contacts.map((c) => c.id).filter(Boolean) as string[];

      for (const cid of incomingContactIds) {
        const belongs = existingMappings.some((m) => m.contactId === cid);
        if (!belongs) {
          throw new BadRequestException(MESSAGES.WAREHOUSE.CONTACT_ID_MISMATCH);
        }
      }

      const mappingsToDelete = existingMappings.filter((m) => !incomingContactIds.includes(m.contactId));
      if (mappingsToDelete.length > 0) {
        const contactIdsToDelete = mappingsToDelete.map((m) => m.contactId);
        await this.warehouseContactRepository.getRepository(manager).delete({
          warehouseId: id,
          contactId: In(contactIdsToDelete),
        });
        await this.cleanOrphanedContacts(contactIdsToDelete, manager);
      }

      for (const contactDto of dto.contacts) {
        if (contactDto.id) {
          // Update existing
          await this.contactRepository.update(
            { id: contactDto.id },
            {
              userId: contactDto.userId,
              fullName: contactDto.fullName,
              email: contactDto.email,
              phone: contactDto.phone,
            },
            manager,
          );

          await this.warehouseContactRepository.update(
            { warehouseId: id, contactId: contactDto.id },
            { isDefault: contactDto.isDefault },
            manager,
          );
        } else {
          // Insert new
          const contactInstance = this.contactRepository.create(
            {
              userId: contactDto.userId,
              fullName: contactDto.fullName,
              email: contactDto.email,
              phone: contactDto.phone,
            },
            manager,
          );
          const contact = await this.contactRepository.save(contactInstance, manager);

          const mappingInstance = this.warehouseContactRepository.create(
            {
              warehouseId: id,
              contactId: contact.id,
              isDefault: contactDto.isDefault,
            },
            manager,
          );
          await this.warehouseContactRepository.save(mappingInstance, manager);
        }
      }

      return (await this.warehouseRepository.findOne(
        {
          where: { id, branchId: activeBranchId },
          relations: { address: true, branch: true, contacts: { contact: true } },
        },
        manager,
      ))!;
    });

    return WarehouseMapper.toResponseDto(savedWarehouse);
  }

  async getWarehouseById(
    id: string,
    currentUser: ICurrentUserData,
    activeBranchId: string,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, branchId: activeBranchId },
      relations: { address: true, branch: true, contacts: { contact: true } },
    });
    if (!warehouse) {
      throw new NotFoundException(MESSAGES.WAREHOUSE.NOT_FOUND);
    }
    if (warehouse.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.ACCESS_DENIED);
    }
    return WarehouseMapper.toResponseDto(warehouse);
  }

  async deleteWarehouse(id: string, currentUser: ICurrentUserData, activeBranchId: string): Promise<void> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, branchId: activeBranchId },
      relations: { branch: true },
    });
    if (!warehouse) {
      throw new NotFoundException(MESSAGES.WAREHOUSE.NOT_FOUND);
    }
    if (warehouse.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.ACCESS_DENIED);
    }

    await this.dataSource.transaction(async (manager) => {
      // Get all associated contacts
      const mappings = await this.warehouseContactRepository.find(
        {
          where: { warehouseId: id },
        },
        manager,
      );
      const contactIds = mappings.map((m) => m.contactId);

      // Delete warehouse (will cascade to delete mappings)
      await this.warehouseRepository.getRepository(manager).delete({ id, branchId: activeBranchId });

      // Clean up orphaned contacts
      await this.cleanOrphanedContacts(contactIds, manager);
    });
  }

  async getWarehousesPaginated(
    currentUser: ICurrentUserData,
    query: WarehousePaginationQueryDto,
    activeBranchId: string,
  ): Promise<IPaginatedResponse<WarehouseResponseDto>> {
    const isAssigned = await this.userBranchRepository.findOne({
      where: { userId: currentUser.userId, branchId: activeBranchId },
    });
    if (!isAssigned) {
      throw new ForbiddenException(MESSAGES.WAREHOUSE.BRANCH_ACCESS_DENIED);
    }

    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;

    const baseWhere: FindOptionsWhere<Warehouse> = {
      branch: {
        tenantId: currentUser.tenantId!,
      },
      branchId: activeBranchId,
    };

    if (status) {
      baseWhere.status = status;
    }

    let where: FindOptionsWhere<Warehouse> | FindOptionsWhere<Warehouse>[] = baseWhere;

    if (search?.trim()) {
      const searchVal = `%${search.trim()}%`;
      where = [
        {
          ...baseWhere,
          name: ILike(searchVal),
        },
        {
          ...baseWhere,
          code: ILike(searchVal),
        },
      ];
    }

    const { items, ...paginationData } = await this.warehouseRepository.findAndCountPaginated(page, pageSize, {
      where,
      order: {
        [sortBy]: sortOrder,
      },
      relations: {
        address: true,
        branch: true,
        contacts: { contact: true },
      },
    });

    return {
      items: items.map((w) => WarehouseMapper.toResponseDto(w)),
      ...paginationData,
    };
  }

  async contactSearch(
    search: string,
    currentUser: ICurrentUserData,
  ): Promise<{
    systemUsers: Array<{ id: string; fullName: string; email: string; phone: string | null }>;
    contacts: Array<{ id: string; userId: string | null; fullName: string; email: string | null; phone: string }>;
  }> {
    const searchTerm = search?.trim() || '';

    // Search system users and existing contacts belonging to the current tenant
    const tenantId = currentUser.tenantId;

    const [users, contacts] = await Promise.all([
      this.userRepository.searchTenantUsers(searchTerm, tenantId, 20),
      this.contactRepository.searchTenantContacts(searchTerm, tenantId, 100),
    ]);

    const uniqueContacts = Array.from(new Map(contacts.map((c) => [c.id, c])).values()).slice(0, 20);

    return {
      systemUsers: users.map((u) => ({
        id: u.id,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: null,
      })),
      contacts: uniqueContacts.map((c) => ({
        id: c.id,
        userId: c.userId || null,
        fullName: c.fullName,
        email: c.email || null,
        phone: c.phone,
      })),
    };
  }

  private async validateContactsPayload(contacts: WarehouseContactUpsertDto[]): Promise<void> {
    const defaultContactsCount = contacts.filter((c) => c.isDefault).length;
    if (defaultContactsCount !== 1) {
      throw new BadRequestException(MESSAGES.WAREHOUSE.MULTIPLE_DEFAULT_CONTACTS);
    }

    const seenNamePhone = new Set<string>();
    const seenNameEmail = new Set<string>();
    for (const contact of contacts) {
      const name = contact.fullName.toLowerCase().trim();
      const phone = contact.phone.trim();
      const email = contact.email.toLowerCase().trim();

      const namePhoneKey = `${name}_${phone}`;
      const nameEmailKey = `${name}_${email}`;

      if (seenNamePhone.has(namePhoneKey) || seenNameEmail.has(nameEmailKey)) {
        throw new BadRequestException(MESSAGES.WAREHOUSE.DUPLICATE_CONTACT);
      }
      seenNamePhone.add(namePhoneKey);
      seenNameEmail.add(nameEmailKey);
    }

    for (const contact of contacts) {
      if (contact.userId) {
        const userExists = await this.userRepository.findOne({
          where: { id: contact.userId },
        });
        if (!userExists) {
          throw new NotFoundException(MESSAGES.WAREHOUSE.USER_NOT_FOUND);
        }
      }
    }
  }

  private async cleanOrphanedContacts(contactIds: string[], manager: EntityManager): Promise<void> {
    if (!contactIds || contactIds.length === 0) {
      return;
    }

    // Find any remaining mappings for these contacts
    const remainingMappings = await this.warehouseContactRepository.find(
      {
        where: { contactId: In(contactIds) },
      },
      manager,
    );

    const activeContactIds = new Set(remainingMappings.map((m) => m.contactId));
    const contactIdsToClean = contactIds.filter((cid) => !activeContactIds.has(cid));

    if (contactIdsToClean.length > 0) {
      await this.contactRepository.getRepository(manager).delete({
        id: In(contactIdsToClean),
      });
    }
  }
}
