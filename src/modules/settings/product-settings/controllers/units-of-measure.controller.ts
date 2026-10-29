import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { UpsertUnitOfMeasureDto } from '../dto/unit-of-measure/upsert-unit-of-measure.dto';
import { UnitOfMeasurePaginationQueryDto } from '../dto/unit-of-measure/unit-of-measure-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';
import type { IApiSuccessResponse, IPaginatedResponse } from '@/common/types/api-response.interface';
import type { UnitOfMeasureResponseDto } from '../dto/unit-of-measure/unit-of-measure-response.dto';

@Controller('product-settings/units-of-measure')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class UnitsOfMeasureController {
  constructor(private readonly uomService: UnitOfMeasureService) {}

  @Post()
  @Permissions(Page.UnitsOfMeasure, Permission.CREATE)
  async createUnitOfMeasure(
    @Body() dto: UpsertUnitOfMeasureDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<UnitOfMeasureResponseDto>> {
    const result = await this.uomService.createUnitOfMeasure(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_UNIT_OF_MEASURE.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.UnitsOfMeasure, Permission.VIEW)
  async getUnitsOfMeasurePaginated(
    @CurrentUser() user: ICurrentUserData,
    @Query() query: UnitOfMeasurePaginationQueryDto,
  ): Promise<IApiSuccessResponse<IPaginatedResponse<UnitOfMeasureResponseDto>>> {
    const result = await this.uomService.getUnitsOfMeasurePaginated(query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_UNIT_OF_MEASURE.FETCH_ALL_SUCCESS);
  }

  @Get(':unitId')
  @Permissions(Page.UnitsOfMeasure, Permission.VIEW)
  async getUnitOfMeasureById(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<UnitOfMeasureResponseDto>> {
    const result = await this.uomService.getUnitOfMeasureById(unitId, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_UNIT_OF_MEASURE.FETCH_SUCCESS);
  }

  @Patch(':unitId')
  @Permissions(Page.UnitsOfMeasure, Permission.UPDATE)
  async updateUnitOfMeasure(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: UpsertUnitOfMeasureDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<UnitOfMeasureResponseDto>> {
    const result = await this.uomService.updateUnitOfMeasure(unitId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_UNIT_OF_MEASURE.UPDATE_SUCCESS);
  }

  @Delete(':unitId')
  @Permissions(Page.UnitsOfMeasure, Permission.DELETE)
  async deleteUnitOfMeasure(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<null>> {
    await this.uomService.deleteUnitOfMeasure(unitId, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT_UNIT_OF_MEASURE.DELETE_SUCCESS);
  }
}
