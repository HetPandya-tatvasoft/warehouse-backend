import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Product } from './product.entity';
import { ProductAttributeConfig } from './product-attribute-config.entity';
import { ProductAttributeValue } from '@/modules/settings/product-settings/entities/attribute-value.entity';

@Index('uq_prod_attr_cfg_val_cfg_attr_val', ['attributeConfigId', 'attributeValueId'], { unique: true })
@Index('uq_prod_attr_cfg_val_cfg_code', ['attributeConfigId', 'code'], {
  unique: true,
  where: '"code" IS NOT NULL',
})
@Index('idx_prod_attr_cfg_val_tenant_prod', ['tenantId', 'productId'])
@Entity('product_attribute_config_values')
export class ProductAttributeConfigValue extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'attribute_config_id', type: 'uuid' })
  attributeConfigId!: string;

  @ManyToOne(() => ProductAttributeConfig, (config) => config.valueConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attribute_config_id' })
  attributeConfig!: ProductAttributeConfig;

  @Column({ name: 'attribute_value_id', type: 'uuid' })
  attributeValueId!: string;

  @ManyToOne(() => ProductAttributeValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_value_id' })
  attributeValue!: ProductAttributeValue;

  @Column({ type: 'varchar', length: 20, nullable: true })
  code!: string | null;
}
