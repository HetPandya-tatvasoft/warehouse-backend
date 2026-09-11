import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleUpsertDto } from '../dto/role-upsert.dto';
import { RolePaginationQueryDto } from '../dto/role-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { UpdateRolePageRightsDto } from '../dto/update-role-page-rights.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Page, Permission } from '../enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('roles')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions(Page.Roles, Permission.CREATE)
  async createRole(@Body() roleDto: RoleUpsertDto, @CurrentUser() user: ICurrentUserData) {
    const role = await this.roleService.createRole(roleDto, user);
    return ApiResponseUtil.success(role, MESSAGES.ROLE.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.Roles, Permission.VIEW)
  async getRolesPaginated(@CurrentUser() user: ICurrentUserData, @Query() paginationQuery: RolePaginationQueryDto) {
    const result = await this.roleService.getRolesPaginated(user, paginationQuery);
    return ApiResponseUtil.success(result, MESSAGES.ROLE.FETCH_ALL_SUCCESS);
  }

  @Get(':id')
  @Permissions(Page.Roles, Permission.VIEW)
  async getRoleById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    const role = await this.roleService.getRoleById(id, user);
    return ApiResponseUtil.success(role, MESSAGES.ROLE.FETCH_SUCCESS);
  }

  @Put(':id')
  @Permissions(Page.Roles, Permission.UPDATE)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleDto: RoleUpsertDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const role = await this.roleService.updateRole(id, roleDto, user);
    return ApiResponseUtil.success(role, MESSAGES.ROLE.UPDATE_SUCCESS);
  }

  @Delete(':id')
  @Permissions(Page.Roles, Permission.DELETE)
  async deleteRole(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    await this.roleService.deleteRole(id, user);
    return ApiResponseUtil.success(null, MESSAGES.ROLE.DELETE_SUCCESS);
  }

  @Get(':roleId/page-rights')
  @Permissions(Page.Roles, Permission.VIEW)
  async getPageRights(@Param('roleId', ParseUUIDPipe) roleId: string, @CurrentUser() user: ICurrentUserData) {
    const result = await this.roleService.getPageRights(roleId, user);
    return ApiResponseUtil.success(result, MESSAGES.ROLE.PAGE_RIGHTS_FETCH_SUCCESS);
  }

  @Put(':roleId/page-rights')
  @Permissions(Page.Roles, Permission.UPDATE)
  async updatePageRights(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRolePageRightsDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    await this.roleService.updatePageRights(roleId, dto, user);
    return ApiResponseUtil.success(null, MESSAGES.ROLE.PAGE_RIGHTS_UPDATE_SUCCESS);
  }
}
