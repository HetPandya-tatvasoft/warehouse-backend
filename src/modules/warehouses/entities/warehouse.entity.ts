import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { TenantBranch } from '../../branches/entities/tenant-branch.entity';
import { Address } from '../../../common/entities/address.entity';
import { WarehouseStatus } from '../enums/warehouse-status.enum';
import { WarehouseContact } from './warehouse-contact.entity';

@Index('uq_warehouses_branch_id_name', ['branchId', 'name'], { unique: true })
@Index('uq_warehouses_branch_id_code', ['branchId', 'code'], { unique: true })
@Entity({
  name: 'warehouses',
})
export class Warehouse extends AuditableEntity {
  @Column({
    name: 'branch_id',
    type: 'uuid',
  })
  branchId!: string;

  @ManyToOne(() => TenantBranch, (branch) => branch.warehouses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: TenantBranch;

  @Column({
    name: 'address_id',
    type: 'uuid',
  })
  addressId!: string;

  @OneToOne(() => Address, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'address_id' })
  address!: Address;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  code!: string;

  @Column({
    type: 'enum',
    enum: WarehouseStatus,
    enumName: 'warehouse_status',
    default: WarehouseStatus.ACTIVE,
  })
  status!: WarehouseStatus;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  isDefault!: boolean;

  @OneToMany(() => WarehouseContact, (warehouseContact) => warehouseContact.warehouse)
  contacts!: WarehouseContact[];
}
