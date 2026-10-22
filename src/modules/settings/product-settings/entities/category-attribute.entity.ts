import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { ProductCategory } from './category.entity';
import { ProductAttribute } from './attribute.entity';

@Index('uq_product_category_attributes_tenant_cat_attr', ['tenantId', 'categoryId', 'attributeId'], { unique: true })
@Index('idx_product_category_attributes_tenant_category', ['tenantId', 'categoryId'])
@Index('idx_product_category_attributes_tenant_attribute', ['tenantId', 'attributeId'])
@Entity('product_category_attributes')
export class ProductCategoryAttribute extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => ProductCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: ProductCategory;

  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: ProductAttribute;
}
