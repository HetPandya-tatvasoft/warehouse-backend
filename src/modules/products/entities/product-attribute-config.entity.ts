import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Product } from './product.entity';
import { ProductAttribute } from '@/modules/settings/product-settings/entities/attribute.entity';
import { ProductAttributeType } from '../enums/product.enums';
import { ProductAttributeConfigValue } from './product-attribute-config-value.entity';

@Index('uq_product_attribute_configs_product_attr', ['productId', 'attributeId'], { unique: true })
@Entity('product_attribute_configs')
export class ProductAttributeConfig extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.attributeConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: ProductAttribute;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProductAttributeType.STATIC,
  })
  type!: ProductAttributeType;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;

  @OneToMany(() => ProductAttributeConfigValue, (val) => val.attributeConfig, { cascade: true })
  valueConfigs!: ProductAttributeConfigValue[];
}
