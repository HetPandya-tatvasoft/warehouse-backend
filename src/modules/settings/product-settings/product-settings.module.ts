import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repositories/category.repository';
import { RolesAndPermissionsModule } from '../../roles-and-permissions/roles-and-permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategory]), RolesAndPermissionsModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [TypeOrmModule, CategoryService, CategoryRepository],
})
export class ProductSettingsModule {}
