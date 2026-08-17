import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { UpsertCategoryDto } from './dto/category/upsert-category.dto';
import { CategoryPaginationQueryDto } from './dto/category/category-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('product-settings/categories')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Permissions(Page.ProductCategories, Permission.CREATE)
  async createCategory(@Body() dto: UpsertCategoryDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.categoryService.createCategory(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_CATEGORY.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.ProductCategories, Permission.VIEW)
  async getCategoriesPaginated(@Query() query: CategoryPaginationQueryDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.categoryService.getCategoriesPaginated(query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_CATEGORY.FETCH_ALL_SUCCESS);
  }

  @Get(':id')
  @Permissions(Page.ProductCategories, Permission.VIEW)
  async getCategoryById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    const result = await this.categoryService.getCategoryById(id, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_CATEGORY.FETCH_SUCCESS);
  }

  @Patch(':id')
  @Permissions(Page.ProductCategories, Permission.UPDATE)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCategoryDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const result = await this.categoryService.updateCategory(id, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_CATEGORY.UPDATE_SUCCESS);
  }

  @Delete(':id')
  @Permissions(Page.ProductCategories, Permission.DELETE)
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    await this.categoryService.deleteCategory(id, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT_CATEGORY.DELETE_SUCCESS);
  }
}
