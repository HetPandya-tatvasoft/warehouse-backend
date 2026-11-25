import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Product } from './product.entity';
import { VariantStatus } from '../enums/product.enums';
import { ProductVariantAttributeValue } from './product-variant-attribute-value.entity';

@Index('uq_product_variants_tenant_sku', ['tenantId', 'sku'], { unique: true })
@Index('uq_product_variants_product_combination', ['productId', 'combinationHash'], { unique: true })
@Entity('product_variants')
export class ProductVariant extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: VariantStatus.ACTIVE,
  })
  status!: VariantStatus;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ name: 'combination_hash', type: 'varchar', length: 255, default: '' })
  combinationHash!: string;

  @OneToMany(() => ProductVariantAttributeValue, (val) => val.variant, { cascade: true })
  variantAttributeValues!: ProductVariantAttributeValue[];
}
