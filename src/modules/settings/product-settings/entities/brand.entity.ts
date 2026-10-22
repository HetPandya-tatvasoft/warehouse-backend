import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { BrandStatus } from '../enums/brand-status.enum';

@Index('uq_product_brands_tenant_name', { synchronize: false })
@Entity('product_brands')
export class ProductBrand extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({
    type: 'enum',
    enum: BrandStatus,
    enumName: 'product_brand_status_enum',
    default: BrandStatus.ACTIVE,
  })
  status!: BrandStatus;
}
