import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/repositories/base.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PasswordResetTokenRepository extends BaseRepository<PasswordResetToken> {
  constructor(
    @InjectRepository(PasswordResetToken)
    repository: Repository<PasswordResetToken>,
  ) {
    super(PasswordResetToken, repository);
  }

  create(data: Partial<PasswordResetToken>, manager?: EntityManager): PasswordResetToken {
    const repository = manager ? manager.getRepository(PasswordResetToken) : this.repository;

    return repository.create(data);
  }

  async save(entity: PasswordResetToken, manager?: EntityManager): Promise<PasswordResetToken> {
    const repository = manager ? manager.getRepository(PasswordResetToken) : this.repository;

    return repository.save(entity);
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.repository.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async markAsUsed(id: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(PasswordResetToken) : this.repository;

    await repository.update(
      { id },
      {
        usedAt: new Date(),
      },
    );
  }

  async invalidateActiveTokens(userId: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(PasswordResetToken) : this.repository;

    await repository.update(
      {
        userId,
        usedAt: IsNull(),
      },
      {
        usedAt: new Date(),
      },
    );
  }

  async deleteExpiredTokens(manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(PasswordResetToken) : this.repository;

    await repository.delete({
      expiresAt: MoreThan(new Date()),
    });
  }
}
