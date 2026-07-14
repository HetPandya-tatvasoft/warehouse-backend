import { Column, Entity, Index } from 'typeorm';

import { AuditableEntity } from '@/common/entities/auditable.entity';

@Index('uq_pages_name', ['name'], {
  unique: true,
})
@Entity({
  name: 'pages',
})
export class Page extends AuditableEntity {
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
