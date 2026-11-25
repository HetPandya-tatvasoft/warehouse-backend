import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { ProductCategory } from '@/modules/settings/product-settings/entities/category.entity';
import { ProductBrand } from '@/modules/settings/product-settings/entities/brand.entity';
import { UnitOfMeasure } from '@/modules/settings/product-settings/entities/unit-of-measure.entity';
import { ProductStatus } from '../enums/product.enums';
import { ProductAttributeConfig } from './product-attribute-config.entity';
import { ProductVariant } from './product-variant.entity';

@Index('uq_products_tenant_code', ['tenantId', 'code'], { unique: true })
@Index('idx_products_tenant_category', ['tenantId', 'categoryId'])
@Index('idx_products_tenant_brand', ['tenantId', 'brandId'])
@Index('idx_products_tenant_status', ['tenantId', 'status'])
@Entity('products')
export class Product extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => ProductCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: ProductCategory;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId!: string | null;

  @ManyToOne(() => ProductBrand, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand!: ProductBrand | null;

  @Column({ name: 'base_uom_id', type: 'uuid' })
  baseUomId!: string;

  @ManyToOne(() => UnitOfMeasure, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'base_uom_id' })
  baseUom!: UnitOfMeasure;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    enumName: 'product_status',
    default: ProductStatus.ACTIVE,
  })
  status!: ProductStatus;

  @Column({ name: 'is_purchasable', type: 'boolean', default: true })
  isPurchasable!: boolean;

  @Column({ name: 'is_sellable', type: 'boolean', default: true })
  isSellable!: boolean;

  // Legacy columns preserved for backwards schema compatibility
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  price!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku!: string | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @OneToMany(() => ProductAttributeConfig, (config) => config.product, { cascade: true })
  attributeConfigs!: ProductAttributeConfig[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants!: ProductVariant[];
}
