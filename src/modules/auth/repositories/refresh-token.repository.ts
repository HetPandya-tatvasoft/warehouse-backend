// Methods to include in this repository
// create, findById, revoke, revokeAllByUserId

import { EntityManager, IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    manager?: EntityManager,
  ): Promise<RefreshToken> {
    const repository = manager ? manager.getRepository(RefreshToken) : this.repository;

    const refreshToken = repository.create({
      id,
      userId,
      tokenHash,
      expiresAt,
    });

    return repository.save(refreshToken);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  async revoke(id: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RefreshToken) : this.repository;
    await repository.update(id, {
      revokedAt: new Date(),
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.repository.update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  async updateRefreshTokenHash(id: string, tokenHash: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RefreshToken) : this.repository;

    await repository.update(id, {
      tokenHash,
    });
  }
}
