import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';
import { Tenant } from '@/modules/tenants/entities/tenant.entity';
import { UnitOfMeasureStatus } from '../enums/unit-of-measure-status.enum';

@Index('uq_units_of_measure_tenant_name', { synchronize: false })
@Index('uq_units_of_measure_tenant_code', { synchronize: false })
@Entity('units_of_measure')
export class UnitOfMeasure extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ name: 'allows_fractional_quantity', type: 'boolean' })
  allowsFractionalQuantity!: boolean;

  @Column({
    type: 'enum',
    enum: UnitOfMeasureStatus,
    enumName: 'unit_of_measure_status_enum',
    default: UnitOfMeasureStatus.ACTIVE,
  })
  status!: UnitOfMeasureStatus;
}
