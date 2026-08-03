import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBranch } from '../entities/user-branch.entity';

@Injectable()
export class UserBranchRepository {
  constructor(
    @InjectRepository(UserBranch)
    private readonly repository: Repository<UserBranch>,
  ) {}

  async findById(id: string, manager?: EntityManager): Promise<UserBranch | null> {
    const repo = manager ? manager.getRepository(UserBranch) : this.repository;
    return repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string, manager?: EntityManager): Promise<UserBranch[]> {
    const repo = manager ? manager.getRepository(UserBranch) : this.repository;
    return repo.find({ where: { userId }, relations: { branch: true } });
  }

  async findByBranchId(branchId: string, manager?: EntityManager): Promise<UserBranch[]> {
    const repo = manager ? manager.getRepository(UserBranch) : this.repository;
    return repo.find({ where: { branchId }, relations: { user: true } });
  }

  async save(userBranch: UserBranch, manager?: EntityManager): Promise<UserBranch> {
    const repo = manager ? manager.getRepository(UserBranch) : this.repository;
    return repo.save(userBranch);
  }
}
