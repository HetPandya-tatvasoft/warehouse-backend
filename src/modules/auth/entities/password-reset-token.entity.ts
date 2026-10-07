import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { User } from '@/modules/users/entities/user.entity';
import { AuditableEntity } from '@/common/entities/auditable.entity';

@Entity({
  name: 'password_reset_tokens',
})
@Index('idx_password_reset_tokens_token_hash', ['tokenHash'])
@Index('idx_password_reset_tokens_user_id', ['userId'])
export class PasswordResetToken extends AuditableEntity {
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
  })
  tokenHash!: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'used_at',
    type: 'timestamptz',
    nullable: true,
  })
  usedAt!: Date | null;
}
