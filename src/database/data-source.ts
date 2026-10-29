import 'dotenv/config';
import { DataSource } from 'typeorm';
import './database.config';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Role } from '../modules/roles-and-permissions/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Permission } from '../modules/roles-and-permissions/entities/permission.entity';
import { Page } from '../modules/roles-and-permissions/entities/page.entity';
import { PageAccess } from '../modules/roles-and-permissions/entities/page-access.entity';
import { RolePageRight } from '../modules/roles-and-permissions/entities/role-page-right.entity';
import { TenantBranch } from '../modules/branches/entities/tenant-branch.entity';
import { UserBranch } from '../modules/branches/entities/user-branch.entity';
import { Country } from '@/modules/reference-data/entities/country.entity';
import { State } from '@/modules/reference-data/entities/state.entity';
import { City } from '@/modules/reference-data/entities/city.entity';
import { Address } from '../common/entities/address.entity';
import { Warehouse } from '../modules/warehouses/entities/warehouse.entity';
import { Contact } from '../modules/warehouses/entities/contact.entity';
import { WarehouseContact } from '../modules/warehouses/entities/warehouse-contact.entity';
import { ProductCategory } from '../modules/settings/product-settings/entities/category.entity';
import { PasswordResetToken } from '@/modules/auth/entities/password-reset-token.entity';
import { ProductAttribute } from '../modules/settings/product-settings/entities/attribute.entity';
import { ProductAttributeValue } from '../modules/settings/product-settings/entities/attribute-value.entity';
import { ProductCategoryAttribute } from '../modules/settings/product-settings/entities/category-attribute.entity';
import { ProductBrand } from '../modules/settings/product-settings/entities/brand.entity';
import { UnitOfMeasure } from '../modules/settings/product-settings/entities/unit-of-measure.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductAttributeConfig } from '../modules/products/entities/product-attribute-config.entity';
import { ProductDynamicAttributeValueConfig } from '../modules/products/entities/product-dynamic-attribute-value-config.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { ProductVariantAttributeValue } from '../modules/products/entities/product-variant-attribute-value.entity';
const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // ssl: {
  //   rejectUnauthorized: false,
  // },

  ssl: false,

  synchronize: false,
  logging: false,

  entities: [
    Tenant,
    Role,
    User,
    UserRole,
    RefreshToken,
    PasswordResetToken,
    Permission,
    Page,
    PageAccess,
    RolePageRight,
    TenantBranch,
    UserBranch,
    Country,
    State,
    City,
    Address,
    Warehouse,
    Contact,
    WarehouseContact,
    ProductCategory,
    ProductAttribute,
    ProductAttributeValue,
    ProductCategoryAttribute,
    ProductBrand,
    UnitOfMeasure,
    Product,
    ProductAttributeConfig,
    ProductDynamicAttributeValueConfig,
    ProductVariant,
    ProductVariantAttributeValue,
  ],

  migrations:
    process.env.NODE_ENV === 'production' ? ['dist/database/migrations/*.js'] : ['src/database/migrations/*.ts'],
});

export default AppDataSource;
