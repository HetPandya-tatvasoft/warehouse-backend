import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Address } from '../../../common/entities/address.entity';

import { TenantStatus } from '../enums/tenant-status.enum';
import { AuditableEntity } from '@/common/entities/auditable.entity';

@Index('uq_tenants_slug', ['slug'], {
  unique: true,
})
@Entity({
  name: 'tenants',
})
export class Tenant extends AuditableEntity {
  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  slug!: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    enumName: 'tenant_status_enum',
    default: TenantStatus.PENDING,
  })
  status!: TenantStatus;

  @Column({
    name: 'company_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyEmail?: string;

  @Column({
    name: 'company_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  companyPhone?: string;

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
}
