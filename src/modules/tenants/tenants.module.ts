import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './services/tenant.service';
import { PlatformTenantController } from './controllers/platform-tenant.controller';
import { TenantRepository } from './repositories/tenant.repository';
import { UsersModule } from '../users/users.module';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { MailModule } from '../mail/mail.module';
import { BranchesModule } from '../branches/branches.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    UsersModule,
    RolesAndPermissionsModule,
    MailModule,
    BranchesModule,
    ReferenceDataModule,
  ],
  controllers: [PlatformTenantController],
  providers: [TenantService, TenantRepository],
  exports: [TypeOrmModule, TenantService, TenantRepository],
})
export class TenantsModule {}
