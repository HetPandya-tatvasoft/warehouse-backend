import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Role } from './role.entity';
import { PageAccess } from './page-access.entity';

@Index('uq_role_page_rights_role_access', ['roleId', 'pageAccessId'], {
  unique: true,
})
@Entity({
  name: 'role_page_rights',
})
export class RolePageRight extends AuditableEntity {
  @Column({
    name: 'role_id',
    type: 'uuid',
  })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({
    name: 'page_access_id',
    type: 'uuid',
  })
  pageAccessId!: string;

  @ManyToOne(() => PageAccess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_access_id' })
  pageAccess!: PageAccess;
}
