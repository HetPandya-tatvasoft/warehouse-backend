import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantBranch } from './entities/tenant-branch.entity';
import { UserBranch } from './entities/user-branch.entity';
import { TenantBranchRepository } from './repositories/tenant-branch.repository';
import { UserBranchRepository } from './repositories/user-branch.repository';
import { BranchesService } from './services/branches.service';
import { BranchesController } from './controllers/branches.controller';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';

@Module({
  imports: [TypeOrmModule.forFeature([TenantBranch, UserBranch]), RolesAndPermissionsModule, ReferenceDataModule],
  controllers: [BranchesController],
  providers: [TenantBranchRepository, UserBranchRepository, BranchesService],
  exports: [TenantBranchRepository, UserBranchRepository, BranchesService, TypeOrmModule],
})
export class BranchesModule {}
