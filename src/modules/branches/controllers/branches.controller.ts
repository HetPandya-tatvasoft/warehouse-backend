import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BranchesService } from '../services/branches.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchPaginationQueryDto } from '../dto/branch-pagination.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { PermissionsGuard } from '@/modules/roles-and-permissions/guards/permissions.guard';
import { Permissions } from '@/modules/roles-and-permissions/decorators/permissions.decorator';
import { Page, Permission } from '@/modules/roles-and-permissions/enums/permissions.enum';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('branches')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Permissions(Page.Branches, Permission.CREATE)
  async createBranch(@Body() createBranchDto: CreateBranchDto, @CurrentUser() user: ICurrentUserData) {
    const createdBranch = await this.branchesService.createBranch(createBranchDto, user);
    return ApiResponseUtil.success(createdBranch, MESSAGES.BRANCH.CREATE_SUCCESS);
  }

  @Get()
  @Permissions(Page.Branches, Permission.VIEW)
  async getBranchesPaginated(
    @CurrentUser() user: ICurrentUserData,
    @Query() paginationQuery: BranchPaginationQueryDto,
  ) {
    const result = await this.branchesService.getBranchesPaginated(user, paginationQuery);
    return ApiResponseUtil.success(result, MESSAGES.BRANCH.FETCH_ALL_SUCCESS);
  }

  @Get(':id')
  @Permissions(Page.Branches, Permission.VIEW)
  async getBranchById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    const foundBranch = await this.branchesService.getBranchById(id, user);
    return ApiResponseUtil.success(foundBranch, MESSAGES.BRANCH.FETCH_SUCCESS);
  }

  @Put(':id')
  @Permissions(Page.Branches, Permission.UPDATE)
  async updateBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() user: ICurrentUserData,
  ) {
    const updatedBranch = await this.branchesService.updateBranch(id, updateBranchDto, user);
    return ApiResponseUtil.success(updatedBranch, MESSAGES.BRANCH.UPDATE_SUCCESS);
  }

  @Delete(':id')
  @Permissions(Page.Branches, Permission.DELETE)
  async deleteBranch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUserData) {
    await this.branchesService.deleteBranch(id, user);
    return ApiResponseUtil.success(null, MESSAGES.BRANCH.DELETE_SUCCESS);
  }
}
