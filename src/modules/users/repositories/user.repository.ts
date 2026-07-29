import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, FindOptionsWhere, EntityManager } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    return repo.findOne({
      where: { email: email.toLowerCase() },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  async findById(id: string, tenantId?: string | null, manager?: EntityManager): Promise<User | null> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    const whereCondition: FindOptionsWhere<User> = { id };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    return repo.findOne({
      where: whereCondition,
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  async findPaginated(
    tenantId: string | null,
    page: number,
    pageSize: number,
    sortBy: keyof User = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    search?: string,
    manager?: EntityManager,
  ): Promise<[User[], number]> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    const whereCondition: FindOptionsWhere<User> = {
      tenantId: tenantId ?? IsNull(),
    };

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      return repo.findAndCount({
        where: [
          { ...whereCondition, email: ILike(searchTerm) },
          { ...whereCondition, firstName: ILike(searchTerm) },
          { ...whereCondition, lastName: ILike(searchTerm) },
        ],
        relations: {
          userRoles: {
            role: true,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          [sortBy]: sortOrder,
        },
      });
    }

    return repo.findAndCount({
      where: whereCondition,
      relations: {
        userRoles: {
          role: true,
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        [sortBy]: sortOrder,
      },
    });
  }

  async createUserWithRoles(userData: Partial<User>, roleIds: string[], manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    const userRoleRepo = manager ? manager.getRepository(UserRole) : this.userRoleRepository;

    const user = repo.create(userData);
    const savedUser = await repo.save(user);

    if (roleIds && roleIds.length > 0) {
      const userRoles = roleIds.map((roleId) =>
        userRoleRepo.create({
          userId: savedUser.id,
          roleId,
        }),
      );
      await userRoleRepo.save(userRoles);
    }

    return (await this.findById(savedUser.id, savedUser.tenantId, manager)) as User;
  }

  async updateUserWithRoles(
    userId: string,
    userData: Partial<User>,
    roleIds?: string[],
    tenantId?: string | null,
    manager?: EntityManager,
  ): Promise<User | null> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    const userRoleRepo = manager ? manager.getRepository(UserRole) : this.userRoleRepository;

    const existingUser = await this.findById(userId, tenantId, manager);
    if (!existingUser) {
      return null;
    }

    // Update basic user properties
    if (Object.keys(userData).length > 0) {
      await repo.update(userId, userData);
    }

    // Update roles if roleIds array is passed
    if (roleIds !== undefined) {
      // Remove existing roles
      await userRoleRepo.delete({ userId });

      // Insert new roles
      if (roleIds.length > 0) {
        const newUserRoles = roleIds.map((roleId) =>
          userRoleRepo.create({
            userId,
            roleId,
          }),
        );
        await userRoleRepo.save(newUserRoles);
      }
    }

    return await this.findById(userId, tenantId, manager);
  }

  async updateStatus(
    userId: string,
    isActive: boolean,
    tenantId?: string | null,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    const whereCondition: FindOptionsWhere<User> = { id: userId };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    const result = await repo.update(whereCondition, { isActive });
    return (result.affected ?? 0) > 0;
  }

  async save(user: User, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    return repo.save(user);
  }
}
