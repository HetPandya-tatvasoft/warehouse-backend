import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Tenant } from '../../tenants/entities/tenant.entity';
import { AuditableEntity } from '@/common/entities/auditable.entity';

// Unique index to keep unique roles per tenant
@Index('uq_roles_tenant_name', ['tenantId', 'name'], {
  unique: true,
})
@Entity({
  name: 'roles',
})
export class Role extends AuditableEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string | null;

  @ManyToOne(() => Tenant, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  isDeleted!: boolean;
}
