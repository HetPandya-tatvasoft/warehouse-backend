import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AttributeValueService } from '../services/attribute-value.service';
import { UpsertAttributeValueDto } from '../dto/attribute-value/upsert-attribute-value.dto';
import { AttributeValuePaginationQueryDto } from '../dto/attribute-value/attribute-value-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';
import type { IApiSuccessResponse, IPaginatedResponse } from '@/common/types/api-response.interface';
import type { AttributeValueResponseDto } from '../dto/attribute-value/attribute-value-response.dto';

@Controller('product-settings/attributes/:attributeId/values')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class AttributeValuesController {
  constructor(private readonly attributeValueService: AttributeValueService) {}

  @Post()
  @Permissions(Page.ProductAttributes, Permission.CREATE)
  async createAttributeValue(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body() dto: UpsertAttributeValueDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeValueResponseDto>> {
    const result = await this.attributeValueService.createAttributeValue(attributeId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE_VALUE.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.ProductAttributes, Permission.VIEW)
  async getAttributeValuesPaginated(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @CurrentUser() user: ICurrentUserData,
    @Query() query: AttributeValuePaginationQueryDto,
  ): Promise<IApiSuccessResponse<IPaginatedResponse<AttributeValueResponseDto>>> {
    const result = await this.attributeValueService.getAttributeValuesPaginated(attributeId, query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE_VALUE.FETCH_ALL_SUCCESS);
  }

  @Get(':valueId')
  @Permissions(Page.ProductAttributes, Permission.VIEW)
  async getAttributeValueById(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeValueResponseDto>> {
    const result = await this.attributeValueService.getAttributeValueById(attributeId, valueId, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE_VALUE.FETCH_SUCCESS);
  }

  @Patch(':valueId')
  @Permissions(Page.ProductAttributes, Permission.UPDATE)
  async updateAttributeValue(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
    @Body() dto: UpsertAttributeValueDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<AttributeValueResponseDto>> {
    const result = await this.attributeValueService.updateAttributeValue(attributeId, valueId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_ATTRIBUTE_VALUE.UPDATE_SUCCESS);
  }

  @Delete(':valueId')
  @Permissions(Page.ProductAttributes, Permission.DELETE)
  async deleteAttributeValue(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<null>> {
    await this.attributeValueService.deleteAttributeValue(attributeId, valueId, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT_ATTRIBUTE_VALUE.DELETE_SUCCESS);
  }
}
