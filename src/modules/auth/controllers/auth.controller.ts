import { Controller, Post, Body, Get, UseGuards, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

import { LoginDto } from '../dto/login.dto';
import { JWTAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { ICurrentUserData } from '../types/jwt-payload.interface';
import type { Response } from 'express';
import { RefreshToken } from '../decorators/refresh-token.decorator';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { COOKIE_NAMES } from '@/common/constants/cookie.constants';
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '@/config/cookie.config';
import { RESPONSE_MESSAGES } from '@/common/constants/messages.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    response.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_COOKIE_OPTIONS);

    response.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponseUtil.success(user, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS);
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

      return ApiResponseUtil.success(user, RESPONSE_MESSAGES.AUTH.TOKEN_REFRESH_SUCCESS);
    } catch (error) {
      response.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, ACCESS_COOKIE_OPTIONS);
      response.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JWTAuthGuard)
  async getProfile(@CurrentUser() user: ICurrentUserData) {
    const profile = await this.authService.getProfile(user);

    return ApiResponseUtil.success(profile, RESPONSE_MESSAGES.USER.FETCH_SUCCESS);
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

    return ApiResponseUtil.success<null>(null, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS);
  }
}
