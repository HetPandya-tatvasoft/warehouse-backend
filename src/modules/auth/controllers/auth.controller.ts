import { Controller, Post, Body, Get, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

import { LoginDto } from '../dto/login.dto';
import { SwitchBranchDto } from '../dto/switch-branch.dto';
import { JWTAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { ICurrentUserData } from '../types/jwt-payload.interface';
import type { Request, Response } from 'express';
import { RefreshToken } from '../decorators/refresh-token.decorator';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { COOKIE_NAMES } from '@/common/constants/cookie.constants';
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '@/config/cookie.config';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    response.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_COOKIE_OPTIONS);

    response.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponseUtil.success(user, MESSAGES.AUTH.LOGIN_SUCCESS);
  }

  @Post('refresh-token')
  async refreshToken(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    try {
      const {
        accessToken: generatedAccessToken,
        refreshToken: generatedRefreshToken,
        user,
      } = await this.authService.refreshToken(refreshToken);

      response.cookie(COOKIE_NAMES.ACCESS_TOKEN, generatedAccessToken, ACCESS_COOKIE_OPTIONS);
      response.cookie(COOKIE_NAMES.REFRESH_TOKEN, generatedRefreshToken, REFRESH_COOKIE_OPTIONS);

      return ApiResponseUtil.success(user, MESSAGES.AUTH.TOKEN_REFRESH_SUCCESS);
    } catch (error) {
      response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, ACCESS_COOKIE_OPTIONS);
      response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JWTAuthGuard)
  async getProfile(
    @CurrentUser() user: ICurrentUserData,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const activeBranchIdFromCookie = (request.cookies?.[COOKIE_NAMES.ACTIVE_BRANCH_ID] as string | undefined) ?? null;
    const profile = await this.authService.getProfile(user, activeBranchIdFromCookie);

    if (profile.activeBranch?.id && profile.activeBranch.id !== activeBranchIdFromCookie) {
      response.cookie(COOKIE_NAMES.ACTIVE_BRANCH_ID, profile.activeBranch.id, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return ApiResponseUtil.success(profile, MESSAGES.USER.FETCH_SUCCESS);
  }

  @Post('switch-branch')
  @UseGuards(JWTAuthGuard)
  async switchBranch(
    @CurrentUser() user: ICurrentUserData,
    @Body() switchBranchDto: SwitchBranchDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const profile = await this.authService.switchBranch(user, switchBranchDto.branchId);

    response.cookie(COOKIE_NAMES.ACTIVE_BRANCH_ID, switchBranchDto.branchId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return ApiResponseUtil.success(profile, 'Branch switched successfully.');
  }

  @Post('logout')
  async logout(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    try {
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
    } catch {
      // Proceed with clearing cookies even if DB revocation throws an error
    } finally {
      response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, ACCESS_COOKIE_OPTIONS);
      response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
    }

    return ApiResponseUtil.success<null>(null, MESSAGES.AUTH.LOGOUT_SUCCESS);
  }
}
