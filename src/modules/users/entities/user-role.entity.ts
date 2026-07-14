import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from './user.entity';
import { Role } from '../../roles-and-permissions/entities/role.entity';

@Index('uq_user_roles_user_role', ['userId', 'roleId'], {
  unique: true,
})
@Entity({
  name: 'user_roles',
})
export class UserRole extends AuditableEntity {
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'role_id',
    type: 'uuid',
  })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
