import { EntityManager, Repository } from 'typeorm';
import { RolePageRight } from '../entities/role-page-right.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolePageRightRepository {
  constructor(
    @InjectRepository(RolePageRight)
    private readonly repository: Repository<RolePageRight>,
  ) {}

  async findByRoleId(roleId: string, manager?: EntityManager): Promise<RolePageRight[]> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    return repository.find({
      where: { roleId },
    });
  }

  async deleteByRoleId(roleId: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;
    await repository.delete({ roleId });
  }

  async bulkInsert(roleId: string, pageAccessIds: string[], manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(RolePageRight) : this.repository;

    const mappings = pageAccessIds.map((pageAccessId) => ({
      roleId,
      pageAccessId,
    }));

    if (mappings.length > 0) {
      await repository.insert(mappings);
    }
  }
}
