import { Controller, Post, Body, Get, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './services/auth.service';

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
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    response.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_COOKIE_OPTIONS);

    response.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponseUtil.success(user, 'Login Successful');
  }

  @Post('refresh-token')
  async refreshToken(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    const {
      accessToken: generatedAccessToken,
      refreshToken: generatedRefreshToken,
      user,
    } = await this.authService.refreshToken(refreshToken);

    response.cookie(COOKIE_NAMES.ACCESS_TOKEN, generatedAccessToken, ACCESS_COOKIE_OPTIONS);

    response.cookie(COOKIE_NAMES.REFRESH_TOKEN, generatedRefreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponseUtil.success(user, 'Token refreshed Successfully');
  }

  @Get('me')
  @UseGuards(JWTAuthGuard)
  getProfile(@CurrentUser() user: ICurrentUserData) {
    return ApiResponseUtil.success(user, 'User fetched successfully');
  }

  @Post('logout')
  async logout(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(refreshToken);

    response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);

    response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);

    return ApiResponseUtil.success<null>(null, 'Logout Successful');
  }
}
