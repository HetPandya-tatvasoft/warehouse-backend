import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { BranchStatus } from '../enums/branch-status.enum';

@Index('uq_tenant_branches_tenant_name', ['tenantId', 'name'], {
  unique: true,
})
@Index('idx_tenant_branches_tenant_id', ['tenantId'])
@Entity({
  name: 'tenant_branches',
})
export class TenantBranch extends AuditableEntity {
  @Column({
    name: 'tenant_id',
    type: 'uuid',
  })
  tenantId!: string;

  @ManyToOne(() => Tenant, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'enum',
    enum: BranchStatus,
    enumName: 'branch_status',
    default: BranchStatus.ACTIVE,
  })
  status!: BranchStatus;

  @Column({
    name: 'address_line_1',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  addressLine1?: string;

  @Column({
    name: 'address_line_2',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  addressLine2?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  city?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  state?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  country?: string;

  @Column({
    name: 'postal_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  postalCode?: string;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  isDeleted!: boolean;
}
