import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AttributeService } from '../services/attribute.service';
import { UpsertAttributeDto } from '../dto/attribute/upsert-attribute.dto';
import { AttributePaginationQueryDto } from '../dto/attribute/attribute-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';
import type { IApiSuccessResponse, IPaginatedResponse } from '@/common/types/api-response.interface';
import type { AttributeResponseDto } from '../dto/attribute/attribute-response.dto';

@Controller('product-settings/attributes')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class AttributesController {
  constructor(private readonly attributeService: AttributeService) {}

  @Post()
  @Permissions(Page.ProductAttributes, Permission.CREATE)
  async createAttribute(
    @Body() dto: UpsertAttributeDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeResponseDto>> {
    const result = await this.attributeService.createAttribute(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.ProductAttributes, Permission.VIEW)
  async getAttributesPaginated(
    @CurrentUser() user: ICurrentUserData,
    @Query() query: AttributePaginationQueryDto,
  ): Promise<IApiSuccessResponse<IPaginatedResponse<AttributeResponseDto>>> {
    const result = await this.attributeService.getAttributesPaginated(query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE.FETCH_ALL_SUCCESS);
  }

  @Get(':attributeId')
  @Permissions(Page.ProductAttributes, Permission.VIEW)
  async getAttributeById(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeResponseDto>> {
    const result = await this.attributeService.getAttributeById(attributeId, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE.FETCH_SUCCESS);
  }

  @Patch(':attributeId')
  @Permissions(Page.ProductAttributes, Permission.UPDATE)
  async updateAttribute(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body() dto: UpsertAttributeDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeResponseDto>> {
    const result = await this.attributeService.updateAttribute(attributeId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE.UPDATE_SUCCESS);
  }

  @Delete(':attributeId')
  @Permissions(Page.ProductAttributes, Permission.DELETE)
  async deleteAttribute(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<null>> {
    await this.attributeService.deleteAttribute(attributeId, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT_ATTRIBUTE.DELETE_SUCCESS);
  }
}
