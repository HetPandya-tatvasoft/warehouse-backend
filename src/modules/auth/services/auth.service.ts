import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserMapper } from '../../users/mappers/user.mapper';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { IAccessTokenPayload, IRefreshTokenPayload } from '../types/jwt-payload.interface';
import type { ICurrentUserData } from '../types/jwt-payload.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AUTH_CONSTANTS } from '@/common/constants/auth.constants';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '@/modules/users/entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import ms, { StringValue } from 'ms';
import { PermissionService } from '@/modules/roles-and-permissions/services/permission.service';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly dataSource: DataSource,
    private readonly permissionService: PermissionService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(MESSAGES.AUTH.DEACTIVATED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return user;
  }

  private async generateAccessToken(user: User): Promise<string> {
    const accessTokenPayload: IAccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      tenantId: user.tenantId ?? null,
    };
    return this.jwtService.signAsync(accessTokenPayload);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const refreshToken = await this.createRefreshTokenSession(user.id);

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthUserDto(user),
    };
  }

  private getRefreshTokenExpiryDate(): Date {
    const expiresIn = this.configService.getOrThrow<StringValue>('JWT_REFRESH_EXPIRES_IN');

    return new Date(Date.now() + ms(expiresIn));
  }

  private async generateRefreshToken(userId: string, tokenId: string): Promise<string> {
    const payload: IRefreshTokenPayload = {
      sub: userId,
      tokenId,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, AUTH_CONSTANTS.HASH_SALT_ROUNDS);
  }

  private async createRefreshTokenSession(userId: string, manager?: EntityManager): Promise<string> {
    const tokenId = randomUUID();
    const refreshToken = await this.generateRefreshToken(userId, tokenId);
    const refreshTokenHash = await this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiryDate();

    await this.refreshTokenRepository.createRefreshToken(
      tokenId,
      userId,
      refreshTokenHash,
      refreshTokenExpiresAt,
      manager,
    );

    return refreshToken;
  }

  private async rotateRefreshToken(userId: string, oldTokenId: string): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      await this.refreshTokenRepository.revoke(oldTokenId, manager);
      return this.createRefreshTokenSession(userId, manager);
    });
  }

  private async verifyRefreshToken(refreshToken: string): Promise<IRefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<IRefreshTokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    }
  }

  private async validateStoredRefreshToken(token: string, refreshTokenRecord: RefreshToken | null): Promise<void> {
    if (!refreshTokenRecord) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    } else if (refreshTokenRecord.revokedAt) {
      throw new UnauthorizedException(MESSAGES.AUTH.REFRESH_TOKEN_REVOKED);
    } else if (refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException(MESSAGES.AUTH.REFRESH_TOKEN_EXPIRED);
    }

    const isTokenValid = await bcrypt.compare(token, refreshTokenRecord.tokenHash);
    if (!isTokenValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    }
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    const refreshTokenRecord = await this.refreshTokenRepository.findById(payload.tokenId);

    // Validation of refresh token and throws UnauthorizedException if invalid
    await this.validateStoredRefreshToken(refreshToken, refreshTokenRecord);

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(MESSAGES.USER.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(MESSAGES.AUTH.DEACTIVATED);
    }

    const newRefreshToken = await this.rotateRefreshToken(user.id, refreshTokenRecord!.id);

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: UserMapper.toAuthUserDto(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const refreshTokenRecord = await this.refreshTokenRepository.findById(payload.tokenId);

    await this.validateStoredRefreshToken(refreshToken, refreshTokenRecord);

    await this.refreshTokenRepository.revoke(refreshTokenRecord!.id);
  }

  async getProfile(user: ICurrentUserData) {
    const dbUser = await this.userRepository.findById(user.userId, user.tenantId);
    if (!dbUser) {
      throw new UnauthorizedException(MESSAGES.USER.NOT_FOUND);
    }

    const permissions = await this.permissionService.getEffectivePermissions(user);

    return {
      id: dbUser.id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      tenantId: dbUser.tenantId ?? null,
      permissions,
    };
  }
}
