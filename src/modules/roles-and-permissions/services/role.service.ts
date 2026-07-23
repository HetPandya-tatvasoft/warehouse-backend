import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { RolePaginationQueryDto } from '../dto/role-pagination.dto';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { Role } from '../entities/role.entity';
import { RoleUpsertDto } from '../dto/role-upsert.dto';
import { DeepPartial } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}

  async createRole(roleDto: RoleUpsertDto, user: ICurrentUserData): Promise<Role> {
    const existingRole = await this.roleRepository.findByName(roleDto.name, user.tenantId);
    if (existingRole) {
      throw new ConflictException('Role with name already exists');
    }

    const roleToCreate: DeepPartial<Role> = {
      name: roleDto.name,
      tenantId: user.tenantId,
      description: roleDto.description,
    };

    return this.roleRepository.createRole(roleToCreate);
  }

  async getRolesPaginated(
    user: ICurrentUserData,
    paginationRequest: RolePaginationQueryDto,
  ): Promise<IPaginatedResponse<Role>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationRequest;

    const [roles, totalItems] = await this.roleRepository.findPaginated(
      user.tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
    );

    return {
      items: roles,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  async getRoleById(id: string, user: ICurrentUserData): Promise<Role> {
    const role = await this.roleRepository.findById(id, user.tenantId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updateRole(id: string, roleDto: RoleUpsertDto, user: ICurrentUserData): Promise<Role> {
    const existingRole = await this.getRoleById(id, user);

    if (roleDto.name && roleDto.name !== existingRole.name) {
      const duplicateRole = await this.roleRepository.findByName(roleDto.name, user.tenantId);
      if (duplicateRole) {
        throw new ConflictException('Role with name already exists');
      }
    }

    const updatedRole = await this.roleRepository.updateRole(
      id,
      {
        name: roleDto.name,
        description: roleDto.description,
      },
      user.tenantId,
    );

    if (!updatedRole) {
      throw new NotFoundException('Role not found');
    }

    return updatedRole;
  }

  async deleteRole(id: string, user: ICurrentUserData): Promise<void> {
    const deleted = await this.roleRepository.deleteRole(id, user.tenantId);
    if (!deleted) {
      throw new NotFoundException('Role not found');
    }
  }
}
