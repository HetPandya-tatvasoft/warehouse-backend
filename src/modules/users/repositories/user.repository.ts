import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, FindOptionsWhere } from 'typeorm';
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

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  async findById(id: string, tenantId?: string | null): Promise<User | null> {
    const whereCondition: FindOptionsWhere<User> = { id };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    return this.repository.findOne({
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
  ): Promise<[User[], number]> {
    const whereCondition: FindOptionsWhere<User> = {
      tenantId: tenantId ?? IsNull(),
    };

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      return this.repository.findAndCount({
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

    return this.repository.findAndCount({
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

  async createUserWithRoles(userData: Partial<User>, roleIds: string[]): Promise<User> {
    const user = this.repository.create(userData);
    const savedUser = await this.repository.save(user);

    if (roleIds && roleIds.length > 0) {
      const userRoles = roleIds.map((roleId) =>
        this.userRoleRepository.create({
          userId: savedUser.id,
          roleId,
        }),
      );
      await this.userRoleRepository.save(userRoles);
    }

    return this.findById(savedUser.id, savedUser.tenantId) as Promise<User>;
  }

  async updateUserWithRoles(
    userId: string,
    userData: Partial<User>,
    roleIds?: string[],
    tenantId?: string | null,
  ): Promise<User | null> {
    const existingUser = await this.findById(userId, tenantId);
    if (!existingUser) {
      return null;
    }

    // Update basic user properties
    if (Object.keys(userData).length > 0) {
      await this.repository.update(userId, userData);
    }

    // Update roles if roleIds array is passed
    if (roleIds !== undefined) {
      // Remove existing roles
      await this.userRoleRepository.delete({ userId });

      // Insert new roles
      if (roleIds.length > 0) {
        const newUserRoles = roleIds.map((roleId) =>
          this.userRoleRepository.create({
            userId,
            roleId,
          }),
        );
        await this.userRoleRepository.save(newUserRoles);
      }
    }

    return this.findById(userId, tenantId);
  }

  async updateStatus(userId: string, isActive: boolean, tenantId?: string | null): Promise<boolean> {
    const whereCondition: FindOptionsWhere<User> = { id: userId };
    if (tenantId !== undefined) {
      whereCondition.tenantId = tenantId ?? IsNull();
    }

    const result = await this.repository.update(whereCondition, { isActive });
    return (result.affected ?? 0) > 0;
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
