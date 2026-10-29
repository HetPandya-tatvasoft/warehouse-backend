import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { MESSAGES } from '@/common/constants/messages.constants';
import { ProductsService } from '../services/products.service';
import { ProductsSelectionService } from '../services/products-selection.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { PreviewVariantsDto } from '../dto/preview-variants.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { AddVariantsDto } from '../dto/add-variants.dto';
import { UpdateVariantStatusDto } from '../dto/update-variant-status.dto';
import { ProductPaginationQueryDto } from '../dto/product-pagination.dto';

@Controller('products')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly selectionService: ProductsSelectionService,
  ) {}

  // 1. Selection endpoints for populating product creation/editing forms
  @Get('selection/categories')
  @Permissions(Page.Products, Permission.CREATE, Permission.UPDATE, Permission.VIEW)
  async getSelectionCategories(@CurrentUser() user: ICurrentUserData) {
    const result = await this.selectionService.getSelectionCategories(user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_CATEGORY.FETCH_ALL_SUCCESS);
  }

  @Get('selection/brands')
  @Permissions(Page.Products, Permission.CREATE, Permission.UPDATE, Permission.VIEW)
  async getSelectionBrands(@CurrentUser() user: ICurrentUserData) {
    const result = await this.selectionService.getSelectionBrands(user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_BRAND.FETCH_ALL_SUCCESS);
  }

  @Get('selection/units-of-measure')
  @Permissions(Page.Products, Permission.CREATE, Permission.UPDATE, Permission.VIEW)
  async getSelectionUoms(@CurrentUser() user: ICurrentUserData) {
    const result = await this.selectionService.getSelectionUoms(user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT_UNIT_OF_MEASURE.FETCH_ALL_SUCCESS);
  }

  @Get('selection/categories/:categoryId/attributes')
  @Permissions(Page.Products, Permission.CREATE, Permission.UPDATE, Permission.VIEW)
  async getSelectionCategoryAttributes(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const result = await this.selectionService.getSelectionCategoryAttributes(categoryId, user);
    return ApiResponseUtil.success(result, MESSAGES.CATEGORY_ATTRIBUTE.FETCH_EFFECTIVE_SUCCESS);
  }

  // 2. Variant Preview
  @Post('preview-variants')
  @Permissions(Page.Products, Permission.CREATE, Permission.UPDATE)
  async previewVariants(@Body() dto: PreviewVariantsDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.productsService.previewVariants(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.PREVIEW_SUCCESS);
  }

  // 3. Create Product
  @Post()
  @Permissions(Page.Products, Permission.CREATE)
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.productsService.createProduct(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.CREATE_SUCCESS);
  }

  // 4. List Products (paginated)
  @Get()
  @Permissions(Page.Products, Permission.VIEW)
  async getProductsPaginated(@Query() query: ProductPaginationQueryDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.productsService.getProductsPaginated(query, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.FETCH_ALL_SUCCESS);
  }

  // 5. Product Details
  @Get(':id')
  @Permissions(Page.Products, Permission.VIEW)
  async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('variantsPage') variantsPage: string = '1',
    @Query('variantsPageSize') variantsPageSize: string = '10',
    @CurrentUser() user: ICurrentUserData,
  ) {
    const pageNum = parseInt(variantsPage, 10) || 1;
    const pageSizeNum = parseInt(variantsPageSize, 10) || 10;
    const result = await this.productsService.getProductById(id, pageNum, pageSizeNum, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.FETCH_SUCCESS);
  }

  // 6. Update Product (basic details, brand, status, flags, static values)
  @Patch(':id')
  @Permissions(Page.Products, Permission.UPDATE)
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const result = await this.productsService.updateProduct(id, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.UPDATE_SUCCESS);
  }

  // 7. Add Variants after creation
  @Post(':id/variants')
  @Permissions(Page.Products, Permission.UPDATE)
  async addVariants(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddVariantsDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const result = await this.productsService.addVariants(id, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.VARIANTS_ADD_SUCCESS);
  }

  // 8. Activate / Deactivate individual variant
  @Patch(':id/variants/:variantId/status')
  @Permissions(Page.Products, Permission.UPDATE)
  async updateVariantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantStatusDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const result = await this.productsService.updateVariantStatus(id, variantId, dto, user);
    return ApiResponseUtil.success(result, MESSAGES.PRODUCT.VARIANT_STATUS_UPDATE_SUCCESS);
  }

  // 9. Permanent variant deletion
  @Delete(':id/variants/:variantId')
  @Permissions(Page.Products, Permission.DELETE)
  async deleteVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @CurrentUser() user: ICurrentUserData,
  ) {
    await this.productsService.deleteVariant(id, variantId, user);
    return ApiResponseUtil.success(null, MESSAGES.PRODUCT.VARIANT_DELETE_SUCCESS);
  }
}
