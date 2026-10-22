import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BrandService } from '../services/brand.service';
import { UpsertBrandDto } from '../dto/brand/upsert-brand.dto';
import { BrandPaginationQueryDto } from '../dto/brand/brand-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';
import type { IApiSuccessResponse, IPaginatedResponse } from '@/common/types/api-response.interface';
import type { BrandResponseDto } from '../dto/brand/brand-response.dto';

@Controller('product-settings/brands')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class BrandsController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Permissions(Page.Brands, Permission.CREATE)
  async createBrand(
    @Body() dto: UpsertBrandDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<BrandResponseDto>> {
    const result = await this.brandService.createBrand(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_BRAND.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.Brands, Permission.VIEW)
  async getBrandsPaginated(
    @CurrentUser() user: ICurrentUserData,
    @Query() query: BrandPaginationQueryDto,
  ): Promise<IApiSuccessResponse<IPaginatedResponse<BrandResponseDto>>> {
    const result = await this.brandService.getBrandsPaginated(query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_BRAND.FETCH_ALL_SUCCESS);
  }

  @Get(':brandId')
  @Permissions(Page.Brands, Permission.VIEW)
  async getBrandById(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<BrandResponseDto>> {
    const result = await this.brandService.getBrandById(brandId, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_BRAND.FETCH_SUCCESS);
  }

  @Patch(':brandId')
  @Permissions(Page.Brands, Permission.UPDATE)
  async updateBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Body() dto: UpsertBrandDto,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<BrandResponseDto>> {
    const result = await this.brandService.updateBrand(brandId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_BRAND.UPDATE_SUCCESS);
  }

  @Delete(':brandId')
  @Permissions(Page.Brands, Permission.DELETE)
  async deleteBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @CurrentUser() user: ICurrentUserData,
  ): Promise<IApiSuccessResponse<null>> {
    await this.brandService.deleteBrand(brandId, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT_BRAND.DELETE_SUCCESS);
  }
}
