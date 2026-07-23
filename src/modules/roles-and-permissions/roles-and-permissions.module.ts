import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Page } from './entities/page.entity';
import { PageAccess } from './entities/page-access.entity';
import { RolePageRight } from './entities/role-page-right.entity';
import { RoleRepository } from './repositories/role.repository';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Page, PageAccess, RolePageRight])],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService],
  exports: [RoleRepository, RoleService, TypeOrmModule],
})
export class RolesAndPermissionsModule {}
