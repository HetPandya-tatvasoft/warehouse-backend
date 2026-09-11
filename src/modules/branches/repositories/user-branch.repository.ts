import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBranch } from '../entities/user-branch.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';

@Injectable()
export class UserBranchRepository extends BaseRepository<UserBranch> {
  constructor(
    @InjectRepository(UserBranch)
    repository: Repository<UserBranch>,
  ) {
    super(UserBranch, repository);
  }

  async findById(id: string, manager?: EntityManager): Promise<UserBranch | null> {
    return this.findOne({ where: { id } }, manager);
  }

  async findByUserId(userId: string, manager?: EntityManager): Promise<UserBranch[]> {
    return this.find({ where: { userId }, relations: { branch: true } }, manager);
  }

  async findByBranchId(branchId: string, manager?: EntityManager): Promise<UserBranch[]> {
    return this.find({ where: { branchId }, relations: { user: true } }, manager);
  }
}
