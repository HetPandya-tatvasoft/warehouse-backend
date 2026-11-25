import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { ProductSettingsModule } from '../settings/product-settings/product-settings.module';

import { Product } from './entities/product.entity';
import { ProductAttributeConfig } from './entities/product-attribute-config.entity';
import { ProductAttributeConfigValue } from './entities/product-attribute-config-value.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantAttributeValue } from './entities/product-variant-attribute-value.entity';

import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductVariantAttributeValueRepository } from './repositories/product-variant-attribute-value.repository';
import { ProductAttributeConfigRepository } from './repositories/product-attribute-config.repository';
import { ProductAttributeConfigValueRepository } from './repositories/product-attribute-config-value.repository';

import { ProductsService } from './services/products.service';
import { ProductsSelectionService } from './services/products-selection.service';
import { ProductsController } from './controllers/products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductAttributeConfig,
      ProductAttributeConfigValue,
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
    ProductVariantAttributeValueRepository,
    ProductAttributeConfigRepository,
    ProductAttributeConfigValueRepository,
    ProductsService,
    ProductsSelectionService,
  ],
  exports: [
    ProductsService,
    ProductRepository,
    ProductVariantRepository,
    ProductVariantAttributeValueRepository,
    ProductAttributeConfigRepository,
    ProductAttributeConfigValueRepository,
  ],
})
export class ProductsModule {}
