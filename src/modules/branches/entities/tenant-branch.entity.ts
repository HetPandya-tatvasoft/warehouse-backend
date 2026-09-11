import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, OneToMany } from 'typeorm';
import { Address } from '../../../common/entities/address.entity';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { BranchStatus } from '../enums/branch-status.enum';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

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

  @ManyToOne(() => Tenant, (tenant) => tenant.branches, {
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
    name: 'address_id',
    type: 'uuid',
  })
  addressId!: string;

  @OneToOne(() => Address, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'address_id' })
  address!: Address;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  isDeleted!: boolean;

  @OneToMany(() => Warehouse, (warehouse) => warehouse.branch)
  warehouses!: Warehouse[];
}
