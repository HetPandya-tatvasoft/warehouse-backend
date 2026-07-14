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
    default: TenantStatus.ACTIVE,
  })
  status!: TenantStatus;

  @Column({
    name: 'contact_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contactEmail?: string;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactPhone?: string;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  isDeleted!: boolean;
}
