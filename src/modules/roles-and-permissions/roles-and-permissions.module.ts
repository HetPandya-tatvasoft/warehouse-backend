import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Page } from './entities/page.entity';
import { PageAccess } from './entities/page-access.entity';
import { RolePageRight } from './entities/role-page-right.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Page, PageAccess, RolePageRight])],
  exports: [TypeOrmModule],
})
export class RolesAndPermissionsModule {}
