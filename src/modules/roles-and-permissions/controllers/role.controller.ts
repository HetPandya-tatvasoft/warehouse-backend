import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleUpsertDto } from '../dto/role-upsert.dto';
import { RolePaginationQueryDto } from '../dto/role-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';

@Controller('roles')
@UseGuards(JWTAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async createRole(@Body() roleDto: RoleUpsertDto, @CurrentUser() user: ICurrentUserData) {
    const role = await this.roleService.createRole(roleDto, user);
    return ApiResponseUtil.success(role, 'Role created successfully');
  }

  @Get()
  async getRolesPaginated(@CurrentUser() user: ICurrentUserData, @Query() paginationQuery: RolePaginationQueryDto) {
    const result = await this.roleService.getRolesPaginated(user, paginationQuery);
    return ApiResponseUtil.success(result, 'Roles fetched successfully');
  }

  @Get(':id')
  async getRoleById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    const role = await this.roleService.getRoleById(id, user);
    return ApiResponseUtil.success(role, 'Role fetched successfully');
  }

  @Put(':id')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleDto: RoleUpsertDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const role = await this.roleService.updateRole(id, roleDto, user);
    return ApiResponseUtil.success(role, 'Role updated successfully');
  }

  @Delete(':id')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    await this.roleService.deleteRole(id, user);
    return ApiResponseUtil.success(null, 'Role deleted successfully');
  }
}
