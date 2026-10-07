import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    MailModule,
    RolesAndPermissionsModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<JwtSignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenRepository, PasswordResetTokenRepository],
  exports: [TypeOrmModule],
})
export class AuthModule {}
