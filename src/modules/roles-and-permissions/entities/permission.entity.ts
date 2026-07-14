import { Column, Entity, Index } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';

@Index('uq_permissions_name', ['name'], {
  unique: true,
})
@Entity({
  name: 'permissions',
})
export class Permission extends AuditableEntity {
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
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  isDeleted!: boolean;
}
