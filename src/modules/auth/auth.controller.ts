import { Controller, Post, Body, Get, UseGuards, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { UserRepository } from '../../modules/users/repositories/user.repository';
import { PermissionService } from '../../modules/roles-and-permissions/services/permission.service';

import { LoginDto } from './dto/login.dto';
import { JWTAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { ICurrentUserData } from './types/jwt-payload.interface';
import type { Response } from 'express';
import { RefreshToken } from './decorators/refresh-token.decorator';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { COOKIE_NAMES } from '@/common/constants/cookie.constants';
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '@/config/cookie.config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly permissionService: PermissionService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    response.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_COOKIE_OPTIONS);

    response.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponseUtil.success(user, 'Login Successful');
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

      return ApiResponseUtil.success(user, 'Token refreshed Successfully');
    } catch (error) {
      response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, ACCESS_COOKIE_OPTIONS);
      response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JWTAuthGuard)
  async getProfile(@CurrentUser() user: ICurrentUserData) {
    const dbUser = await this.userRepository.findById(user.userId, user.tenantId);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = await this.permissionService.getEffectivePermissions(user);

    return ApiResponseUtil.success(
      {
        id: dbUser.id,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        email: dbUser.email,
        tenantId: dbUser.tenantId ?? null,
        permissions,
      },
      'User fetched successfully',
    );
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

    return ApiResponseUtil.success<null>(null, 'Logout Successful');
  }
}
