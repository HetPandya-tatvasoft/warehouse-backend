import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repositories/category.repository';
import { RolesAndPermissionsModule } from '../../roles-and-permissions/roles-and-permissions.module';
import { ProductAttribute } from './entities/attribute.entity';
import { ProductAttributeValue } from './entities/attribute-value.entity';
import { AttributesController } from './controllers/attributes.controller';
import { AttributeValuesController } from './controllers/attribute-values.controller';
import { AttributeService } from './services/attribute.service';
import { AttributeValueService } from './services/attribute-value.service';
import { AttributeRepository } from './repositories/attribute.repository';
import { AttributeValueRepository } from './repositories/attribute-value.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductCategory, ProductAttribute, ProductAttributeValue]),
    RolesAndPermissionsModule,
  ],
  controllers: [CategoryController, AttributesController, AttributeValuesController],
  providers: [
    CategoryService,
    CategoryRepository,
    AttributeService,
    AttributeValueService,
    AttributeRepository,
    AttributeValueRepository,
  ],
  exports: [TypeOrmModule, CategoryService, CategoryRepository, AttributeService, AttributeValueService],
})
export class ProductSettingsModule {}
