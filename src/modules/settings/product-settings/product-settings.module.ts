import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repositories/category.repository';
import { RolesAndPermissionsModule } from '../../roles-and-permissions/roles-and-permissions.module';
import { ProductAttribute } from './entities/attribute.entity';
import { ProductAttributeValue } from './entities/attribute-value.entity';
import { ProductCategoryAttribute } from './entities/category-attribute.entity';
import { AttributesController } from './controllers/attributes.controller';
import { AttributeValuesController } from './controllers/attribute-values.controller';
import { AttributeService } from './services/attribute.service';
import { AttributeValueService } from './services/attribute-value.service';
import { CategoryAttributeService } from './services/category-attribute.service';
import { AttributeRepository } from './repositories/attribute.repository';
import { AttributeValueRepository } from './repositories/attribute-value.repository';
import { CategoryAttributeRepository } from './repositories/category-attribute.repository';

import { ProductBrand } from './entities/brand.entity';
import { BrandsController } from './controllers/brands.controller';
import { BrandService } from './services/brand.service';
import { BrandRepository } from './repositories/brand.repository';

import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitsOfMeasureController } from './controllers/units-of-measure.controller';
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { UnitOfMeasureRepository } from './repositories/unit-of-measure.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategory,
      ProductAttribute,
      ProductAttributeValue,
      ProductCategoryAttribute,
      ProductBrand,
      UnitOfMeasure,
    ]),
    RolesAndPermissionsModule,
  ],
  controllers: [
    CategoryController,
    AttributesController,
    AttributeValuesController,
    BrandsController,
    UnitsOfMeasureController,
  ],
  providers: [
    CategoryService,
    CategoryRepository,
    AttributeService,
    AttributeValueService,
    CategoryAttributeService,
    AttributeRepository,
    AttributeValueRepository,
    CategoryAttributeRepository,
    BrandService,
    BrandRepository,
    UnitOfMeasureService,
    UnitOfMeasureRepository,
  ],
  exports: [
    TypeOrmModule,
    CategoryService,
    CategoryRepository,
    AttributeService,
    AttributeValueService,
    CategoryAttributeService,
    CategoryAttributeRepository,
    BrandService,
    BrandRepository,
    UnitOfMeasureService,
    UnitOfMeasureRepository,
  ],
})
export class ProductSettingsModule {}
