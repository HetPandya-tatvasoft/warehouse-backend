import { Column, Entity, Index } from 'typeorm';

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
