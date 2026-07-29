import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPaginationQueryDto } from '../dto/user-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';

@Controller('users')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Permissions(Page.Users, Permission.CREATE)
  async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() user: ICurrentUserData) {
    const createdUser = await this.userService.createUser(createUserDto, user);
    return ApiResponseUtil.success(createdUser, 'User created successfully');
  }

  @Get()
  @Permissions(Page.Users, Permission.VIEW)
  async getUsersPaginated(@CurrentUser() user: ICurrentUserData, @Query() paginationQuery: UserPaginationQueryDto) {
    const result = await this.userService.getUsersPaginated(user, paginationQuery);
    return ApiResponseUtil.success(result, 'Users fetched successfully');
  }

  @Get(':id')
  @Permissions(Page.Users, Permission.VIEW)
  async getUserById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    const foundUser = await this.userService.getUserById(id, user);
    return ApiResponseUtil.success(foundUser, 'User fetched successfully');
  }

  @Put(':id')
  @Permissions(Page.Users, Permission.UPDATE)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const updatedUser = await this.userService.updateUser(id, updateUserDto, user);
    return ApiResponseUtil.success(updatedUser, 'User updated successfully');
  }

  @Patch(':id/status')
  @Permissions(Page.Users, Permission.UPDATE)
  async toggleUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const updatedUser = await this.userService.toggleUserStatus(id, isActive, user);
    return ApiResponseUtil.success(updatedUser, 'User status updated successfully');
  }
}
