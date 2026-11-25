import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '@/common/entities/auditable.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductAttribute } from '@/modules/settings/product-settings/entities/attribute.entity';
import { ProductAttributeValue } from '@/modules/settings/product-settings/entities/attribute-value.entity';

@Index('uq_product_variant_attr_vals_variant_attr', ['variantId', 'attributeId'], { unique: true })
@Entity('product_variant_attribute_values')
export class ProductVariantAttributeValue extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId!: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.variantAttributeValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant;

  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: ProductAttribute;

  @Column({ name: 'attribute_value_id', type: 'uuid' })
  attributeValueId!: string;

  @ManyToOne(() => ProductAttributeValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_value_id' })
  attributeValue!: ProductAttributeValue;
}
