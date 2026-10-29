import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { ProductSettingsModule } from '../settings/product-settings/product-settings.module';

import { Product } from './entities/product.entity';
import { ProductAttributeConfig } from './entities/product-attribute-config.entity';
import { ProductDynamicAttributeValueConfig } from './entities/product-dynamic-attribute-value-config.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantAttributeValue } from './entities/product-variant-attribute-value.entity';

import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductAttributeConfigRepository } from './repositories/product-attribute-config.repository';
import { ProductDynamicAttributeValueConfigRepository } from './repositories/product-dynamic-attribute-value-config.repository';

import { ProductsService } from './services/products.service';
import { ProductsSelectionService } from './services/products-selection.service';
import { ProductsController } from './controllers/products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductAttributeConfig,
      ProductDynamicAttributeValueConfig,
      ProductVariant,
      ProductVariantAttributeValue,
    ]),
    RolesAndPermissionsModule,
    ProductSettingsModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductRepository,
    ProductVariantRepository,
    ProductAttributeConfigRepository,
    ProductDynamicAttributeValueConfigRepository,
    ProductsService,
    ProductsSelectionService,
  ],
  exports: [
    ProductsService,
    ProductRepository,
    ProductVariantRepository,
    ProductAttributeConfigRepository,
    ProductDynamicAttributeValueConfigRepository,
  ],
})
export class ProductsModule {}
