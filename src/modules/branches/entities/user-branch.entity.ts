import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { TenantBranch } from './tenant-branch.entity';

@Index('uq_user_branch', ['userId', 'branchId'], {
  unique: true,
})
@Index('uq_user_primary_branch', ['userId'], {
  unique: true,
  where: 'is_primary = TRUE',
})
@Index('idx_user_branches_user_id', ['userId'])
@Index('idx_user_branches_branch_id', ['branchId'])
@Entity({
  name: 'user_branches',
})
export class UserBranch extends AuditableEntity {
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'branch_id',
    type: 'uuid',
  })
  branchId!: string;

  @ManyToOne(() => TenantBranch, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: TenantBranch;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;
  @Column({
    name: 'assigned_by',
    type: 'uuid',
    nullable: true,
  })
  assignedBy?: string | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: User | null;
}
