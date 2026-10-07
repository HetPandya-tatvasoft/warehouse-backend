import { EntityManager, IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    repository: Repository<RefreshToken>,
  ) {
    super(RefreshToken, repository);
  }

  async createRefreshToken(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    manager?: EntityManager,
  ): Promise<RefreshToken> {
    const refreshToken = this.create(
      {
        id,
        userId,
        tokenHash,
        expiresAt,
      },
      manager,
    );

    return this.save(refreshToken, manager);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.findOne({
      where: {
        id,
      },
    });
  }

  async revoke(id: string, manager?: EntityManager): Promise<void> {
    await this.update(
      { id },
      {
        revokedAt: new Date(),
      },
      manager,
    );
  }

  async revokeAllUserTokens(userId: string, manager?: EntityManager): Promise<void> {
    await this.update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
      manager,
    );
  }

  async updateRefreshTokenHash(id: string, tokenHash: string, manager?: EntityManager): Promise<void> {
    await this.update(
      { id },
      {
        tokenHash,
      },
      manager,
    );
  }
}
