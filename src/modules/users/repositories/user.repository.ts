import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, FindOptionsWhere, EntityManager, FindOptionsRelations } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { IPaginatedResponse } from '../../../common/types/api-response.interface';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(User, repository);
  }

  async findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return this.findOne(
      {
        where: { email: email.toLowerCase() },
        relations: {
          userRoles: {
            role: true,
          },
        },
      },
      manager,
    );
  }

  async findById(id: string, tenantId?: string | null, manager?: EntityManager): Promise<User | null> {
    const whereCondition: FindOptionsWhere<User> = { id };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    return this.findOne(
      {
        where: whereCondition,
        relations: {
          userRoles: {
            role: true,
          },
        },
      },
      manager,
    );
  }

  async findByIdWithBranches(id: string, tenantId?: string | null, manager?: EntityManager): Promise<User | null> {
    const whereCondition: FindOptionsWhere<User> = { id };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    return this.findOne(
      {
        where: whereCondition,
        relations: {
          userRoles: {
            role: true,
          },
          userBranches: {
            branch: true,
          },
        },
      },
      manager,
    );
  }

  async findPaginated(
    tenantId: string | null,
    page: number,
    pageSize: number,
    sortBy: keyof User = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    loadBranches = false,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<User>> {
    const whereCondition: FindOptionsWhere<User> = {
      tenantId: tenantId ?? IsNull(),
    };

    const where = search?.trim()
      ? [
          { ...whereCondition, email: ILike(`%${search.trim()}%`) },
          { ...whereCondition, firstName: ILike(`%${search.trim()}%`) },
          { ...whereCondition, lastName: ILike(`%${search.trim()}%`) },
        ]
      : whereCondition;

    const relations: FindOptionsRelations<User> = {
      userRoles: {
        role: true,
      },
    };

    if (loadBranches) {
      relations.userBranches = {
        branch: true,
      };
    }

    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where,
        relations,
        order: {
          [sortBy]: sortOrder,
        },
      },
      manager,
    );
  }

  async updateStatus(
    userId: string,
    isActive: boolean,
    tenantId?: string | null,
    manager?: EntityManager,
  ): Promise<boolean> {
    const whereCondition: FindOptionsWhere<User> = { id: userId };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    const result = await this.update(whereCondition, { isActive }, manager);
    return (result.affected ?? 0) > 0;
  }

  async searchTenantUsers(searchTerm: string, tenantId: string | null, limit = 20): Promise<User[]> {
    const searchPattern = searchTerm ? `%${searchTerm}%` : undefined;
    let where: FindOptionsWhere<User>[];

    if (searchPattern) {
      const parts = searchTerm.trim().split(/\s+/);
      const isFullNameSearch = parts.length > 1;

      if (isFullNameSearch) {
        const firstNamePart = ILike(`%${parts[0]}%`);
        const lastNamePart = ILike(`%${parts.slice(1).join(' ')}%`);
        where = [
          { tenantId: tenantId ?? IsNull(), isActive: true, firstName: firstNamePart, lastName: lastNamePart },
          { tenantId: tenantId ?? IsNull(), isActive: true, firstName: lastNamePart, lastName: firstNamePart },
          { tenantId: tenantId ?? IsNull(), isActive: true, email: ILike(searchPattern) },
        ];
      } else {
        const pattern = ILike(searchPattern);
        where = [
          { tenantId: tenantId ?? IsNull(), isActive: true, firstName: pattern },
          { tenantId: tenantId ?? IsNull(), isActive: true, lastName: pattern },
          { tenantId: tenantId ?? IsNull(), isActive: true, email: pattern },
        ];
      }
    } else {
      where = [{ tenantId: tenantId ?? IsNull(), isActive: true }];
    }

    return this.find({ where, take: limit });
  }
}
