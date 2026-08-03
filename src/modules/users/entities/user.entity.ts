import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UserRole } from './user-role.entity';

import { UserBranch } from '../../branches/entities/user-branch.entity';

@Index('uq_users_email', ['email'], {
  unique: true,
})
@Entity({
  name: 'users',
})
export class User extends AuditableEntity {
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string | null;

  @ManyToOne(() => Tenant, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @Column({
    type: 'varchar',
    length: 255,
  })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
  })
  passwordHash!: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
  })
  firstName!: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
  })
  lastName!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => UserBranch, (userBranch) => userBranch.user)
  userBranches!: UserBranch[];
}
