import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { ICurrentUserData } from '../../auth/types/jwt-payload.interface';
import { ApiResponseUtil } from '../../../common/utils/api-response.util';
import { TenantOnboardingDto } from '../dto/tenant-onboarding.dto';
import { TenantPaginationQueryDto } from '../dto/tenant-pagination.dto';
import { TenantService } from '../services/tenant.service';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('platform/tenants')
export class PlatformTenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('onboard')
  @UseGuards(JWTAuthGuard)
  async onboard(@Body() dto: TenantOnboardingDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.tenantService.onboard(dto, user);
    return ApiResponseUtil.success(result, MESSAGES.TENANT.ONBOARD_SUCCESS);
  }

  @Get()
  @UseGuards(JWTAuthGuard)
  async getTenants(@Query() query: TenantPaginationQueryDto, @CurrentUser() user: ICurrentUserData) {
    const result = await this.tenantService.getTenants(query, user);
    return ApiResponseUtil.success(result, MESSAGES.TENANT.FETCH_ALL_SUCCESS);
  }
}
