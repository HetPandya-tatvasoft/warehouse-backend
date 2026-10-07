import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './modules/tenants/tenants.module';
import { RolesAndPermissionsModule } from './modules/roles-and-permissions/roles-and-permissions.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { SharedModule } from './common/shared.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { ProductsModule } from './modules/products/products.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';

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

        ssl: {
        rejectUnauthorized: false,
        },      

        autoLoadEntities: true,

        synchronize: false,

        logging: false,
      }),
    }),
    SharedModule,
    TenantsModule,
    RolesAndPermissionsModule,
    UsersModule,
    AuthModule,
    BranchesModule,
    ReferenceDataModule,
    WarehousesModule,
    ProductsModule,
    SettingsModule,
    HealthModule,
  ],
})
export class AppModule {}
