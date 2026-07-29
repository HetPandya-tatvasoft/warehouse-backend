import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from '@/config/env.validation';
import databaseConfig from '@/config/database.config';
import { RolesAndPermissionsModule } from '@/modules/roles-and-permissions/roles-and-permissions.module';
import { TenantsModule } from '@/modules/tenants/tenants.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PageSeeder } from './authorization/page.seeder';
import { PermissionSeeder } from './authorization/permission.seeder';
import { PageAccessSeeder } from './authorization/page-access.seeder';
import { AuthorizationSeeder } from './authorization/authorization.seeder';
import { SuperAdminSeeder } from './super-admin.seed';
import { TenantUserSeeder } from './tenant-users.seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
    }),
    TenantsModule,
    RolesAndPermissionsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [PageSeeder, PermissionSeeder, PageAccessSeeder, AuthorizationSeeder, SuperAdminSeeder, TenantUserSeeder],
  exports: [AuthorizationSeeder, SuperAdminSeeder, TenantUserSeeder],
})
export class SeederModule {}
