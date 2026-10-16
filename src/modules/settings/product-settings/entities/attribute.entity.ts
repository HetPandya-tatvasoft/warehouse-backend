import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { AttributeStatus } from '../enums/attribute-status.enum';
import { ProductAttributeValue } from './attribute-value.entity';

@Index('uq_product_attributes_tenant_name_ci', { synchronize: false })
@Entity('product_attributes')
export class ProductAttribute extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 150, collation: 'C' })
  name!: string;

  @Column({
    type: 'enum',
    enum: AttributeStatus,
    enumName: 'product_attribute_status_enum',
    default: AttributeStatus.ACTIVE,
  })
  status!: AttributeStatus;

  @OneToMany(() => ProductAttributeValue, (value) => value.attribute)
  values!: ProductAttributeValue[];
}
