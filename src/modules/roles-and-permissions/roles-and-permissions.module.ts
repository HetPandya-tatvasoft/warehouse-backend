import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Page } from './entities/page.entity';
import { PageAccess } from './entities/page-access.entity';
import { RolePageRight } from './entities/role-page-right.entity';
import { RoleRepository } from './repositories/role.repository';
import { RolePageRightRepository } from './repositories/role-page-right.repository';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RoleController } from './controllers/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Page, PageAccess, RolePageRight])],
  controllers: [RoleController],
  providers: [RoleRepository, RolePageRightRepository, RoleService, PermissionService, PermissionsGuard],
  exports: [RoleRepository, RolePageRightRepository, RoleService, PermissionService, PermissionsGuard, TypeOrmModule],
})
export class RolesAndPermissionsModule {}
