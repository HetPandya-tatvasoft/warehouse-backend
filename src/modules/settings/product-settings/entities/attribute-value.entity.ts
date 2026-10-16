import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { ProductAttribute } from './attribute.entity';

@Index('uq_product_attribute_values_attribute_label_ci', { synchronize: false })
@Entity('product_attribute_values')
export class ProductAttributeValue extends AuditableEntity {
  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: ProductAttribute;

  @Column({ type: 'varchar', length: 150, collation: 'C' })
  label!: string;

  @Column({
    type: 'enum',
    enum: AttributeStatus,
    enumName: 'product_attribute_status_enum',
    default: AttributeStatus.ACTIVE,
  })
  status!: AttributeStatus;
}
