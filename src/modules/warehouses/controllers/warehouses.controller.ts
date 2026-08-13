import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { WarehousesService } from '../services/warehouses.service';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseGeneralDto } from '../dto/update-warehouse-general.dto';
import { UpdateWarehouseAddressDto } from '../dto/update-warehouse-address.dto';
import { UpdateWarehouseContactsDto } from '../dto/update-warehouse-contacts.dto';
import { WarehousePaginationQueryDto } from '../dto/warehouse-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { ActiveBranchId } from '@/modules/auth/decorators/active-branch-id.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('warehouses')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Permissions(Page.Warehouses, Permission.CREATE)
  async createWarehouse(
    @Body() dto: CreateWarehouseDto,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const createdWarehouse = await this.warehousesService.createWarehouse(dto, user, activeBranchId);
    return ApiResponseUtil.success(createdWarehouse, MESSAGES.WAREHOUSE.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.Warehouses, Permission.VIEW)
  async getWarehousesPaginated(
    @CurrentUser() user: ICurrentUserData,
    @Query() query: WarehousePaginationQueryDto,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const result = await this.warehousesService.getWarehousesPaginated(user, query, activeBranchId);
    return ApiResponseUtil.success(result, MESSAGES.WAREHOUSE.FETCH_ALL_SUCCESS);
  }

  @Get('contact-search')
  @Permissions(Page.Warehouses, Permission.VIEW)
  async contactSearch(@CurrentUser() user: ICurrentUserData, @Query('search') search: string) {
    const result = await this.warehousesService.contactSearch(search, user);
    return ApiResponseUtil.success(result, MESSAGES.WAREHOUSE.CONTACT_FETCH_SUCCESS);
  }

  @Get(':id')
  @Permissions(Page.Warehouses, Permission.VIEW)
  async getWarehouseById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const foundWarehouse = await this.warehousesService.getWarehouseById(id, user, activeBranchId);
    return ApiResponseUtil.success(foundWarehouse, MESSAGES.WAREHOUSE.FETCH_SUCCESS);
  }

  @Patch(':id/general')
  @Permissions(Page.Warehouses, Permission.UPDATE)
  async updateGeneral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseGeneralDto,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const updatedWarehouse = await this.warehousesService.updateGeneral(id, dto, user, activeBranchId);
    return ApiResponseUtil.success(updatedWarehouse, MESSAGES.WAREHOUSE.UPDATE_SUCCESS);
  }

  @Patch(':id/address')
  @Permissions(Page.Warehouses, Permission.UPDATE)
  async updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseAddressDto,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const updatedWarehouse = await this.warehousesService.updateAddress(id, dto, user, activeBranchId);
    return ApiResponseUtil.success(updatedWarehouse, MESSAGES.WAREHOUSE.UPDATE_SUCCESS);
  }

  @Patch(':id/contacts')
  @Permissions(Page.Warehouses, Permission.UPDATE)
  async updateContacts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseContactsDto,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    const updatedWarehouse = await this.warehousesService.updateContacts(id, dto, user, activeBranchId);
    return ApiResponseUtil.success(updatedWarehouse, MESSAGES.WAREHOUSE.UPDATE_SUCCESS);
  }

  @Delete(':id')
  @Permissions(Page.Warehouses, Permission.DELETE)
  async deleteWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: ICurrentUserData,
    @ActiveBranchId() activeBranchId: string,
  ) {
    await this.warehousesService.deleteWarehouse(id, user, activeBranchId);
    return ApiResponseUtil.success(null, MESSAGES.WAREHOUSE.DELETE_SUCCESS);
  }

  // Implement a dedicated contacts delete button that will be helpful when we click delete button inside warehouse contacts to delete their mappings if contact is associated with other entity or if not associated then simply delete that contact
}
