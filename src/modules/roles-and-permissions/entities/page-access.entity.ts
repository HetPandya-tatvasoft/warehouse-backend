import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Page } from './page.entity';
import { Permission } from './permission.entity';

@Index('uq_page_access_page_permission', ['pageId', 'accessTypeId'], {
  unique: true,
})
@Entity({
  name: 'page_access',
})
export class PageAccess extends AuditableEntity {
  @Column({
    name: 'page_id',
    type: 'uuid',
  })
  pageId!: string;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page!: Page;

  @Column({
    name: 'access_type_id',
    type: 'uuid',
  })
  accessTypeId!: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'access_type_id' })
  accessType!: Permission;
}
