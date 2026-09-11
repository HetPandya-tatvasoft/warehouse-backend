import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, In, EntityManager } from 'typeorm';
import { UserRepository } from '../repositories/user.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { RoleRepository } from '../../roles-and-permissions/repositories/role.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPaginationQueryDto } from '../dto/user-pagination.dto';
import { UserMapper, IUserResponseDto } from '../mappers/user.mapper';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { AUTH_CONSTANTS } from '@/common/constants/auth.constants';

import { MailService } from '../../mail/services/mail.service';
import { MESSAGES } from '@/common/constants/messages.constants';
import { EMAIL_TEMPLATES } from '../../mail/templates/email-templates';

import { UserBranchRepository } from '../../branches/repositories/user-branch.repository';
import { TenantBranchRepository } from '../../branches/repositories/tenant-branch.repository';
import { BranchStatus } from '../../branches/enums/branch-status.enum';
import { UserBranch } from '../../branches/entities/user-branch.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly roleRepository: RoleRepository,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly userBranchRepository: UserBranchRepository,
    private readonly tenantBranchRepository: TenantBranchRepository,
  ) {}

  private async validateAndPrepareUserBranches(
    branchIds: string[],
    primaryBranchId: string,
    tenantId: string,
    userId: string,
    assignedByUserId: string,
    manager?: EntityManager,
  ): Promise<UserBranch[]> {
    const uniqueBranchIds = Array.from(new Set(branchIds));

    if (!uniqueBranchIds.includes(primaryBranchId)) {
      throw new BadRequestException(MESSAGES.USER.PRIMARY_BRANCH_MUST_BE_ASSIGNED);
    }

    const branches = await this.tenantBranchRepository.find(
      {
        where: {
          id: In(uniqueBranchIds),
          tenantId,
          isDeleted: false,
          status: BranchStatus.ACTIVE,
        },
      },
      manager,
    );

    if (branches.length !== uniqueBranchIds.length) {
      throw new NotFoundException(MESSAGES.USER.BRANCHES_NOT_FOUND_OR_INACTIVE);
    }

    return uniqueBranchIds.map((branchId) =>
      this.userBranchRepository.create(
        {
          userId,
          branchId,
          isPrimary: branchId === primaryBranchId,
          assignedBy: assignedByUserId,
        },
        manager,
      ),
    );
  }

  async createUser(createUserDto: CreateUserDto, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(MESSAGES.USER.EMAIL_EXISTS);
    }

    for (const roleId of createUserDto.roleIds) {
      const role = await this.roleRepository.findById(roleId, currentUser.tenantId);
      if (!role) {
        throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND_IN_TENANT(roleId));
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, AUTH_CONSTANTS.HASH_SALT_ROUNDS);

    const userToCreate = {
      email: createUserDto.email.toLowerCase(),
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      passwordHash,
      tenantId: currentUser.tenantId,
      isActive: createUserDto.isActive ?? true,
    };

    const createdUser = await this.dataSource.transaction(async (manager) => {
      const userInstance = this.userRepository.create(userToCreate, manager);
      const savedUser = await this.userRepository.save(userInstance, manager);

      const userBranches = await this.validateAndPrepareUserBranches(
        createUserDto.branchIds,
        createUserDto.primaryBranchId,
        currentUser.tenantId!,
        savedUser.id,
        currentUser.userId,
        manager,
      );

      if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
        const userRoles = createUserDto.roleIds.map((roleId) =>
          this.userRoleRepository.create(
            {
              userId: savedUser.id,
              roleId,
            },
            manager,
          ),
        );
        await this.userRoleRepository.saveMany(userRoles, manager);
      }

      await this.userBranchRepository.saveMany(userBranches, manager);

      return (await this.userRepository.findByIdWithBranches(savedUser.id, savedUser.tenantId, manager))!;
    });

    await this.mailService.send({
      to: createdUser.email,
      ...EMAIL_TEMPLATES.welcomeUser(
        createdUser.firstName,
        createdUser.lastName,
        createdUser.email,
        createUserDto.password,
      ),
    });

    return UserMapper.toUserResponseDto(createdUser);
  }

  async getUsersPaginated(
    currentUser: ICurrentUserData,
    query: UserPaginationQueryDto,
  ): Promise<IPaginatedResponse<IUserResponseDto>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search } = query;

    const { items: users, ...paginationData } = await this.userRepository.findPaginated(
      currentUser.tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      true, // loadBranches
    );

    return {
      items: users.map((user) => UserMapper.toUserResponseDto(user)),
      ...paginationData,
    };
  }

  async getUserById(id: string, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const user = await this.userRepository.findByIdWithBranches(id, currentUser.tenantId);
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }
    return UserMapper.toUserResponseDto(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findById(id, currentUser.tenantId);
    if (!existingUser) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (id === currentUser.userId && updateUserDto.isActive === true) {
      throw new BadRequestException(MESSAGES.USER.CANNOT_SELF_UPDATE);
    }

    for (const roleId of updateUserDto.roleIds) {
      const role = await this.roleRepository.findById(roleId, currentUser.tenantId);
      if (!role) {
        throw new NotFoundException(MESSAGES.ROLE.NOT_FOUND_IN_TENANT(roleId));
      }
    }

    const userDataToUpdate: Partial<typeof existingUser> = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
    };
    if (updateUserDto.isActive !== undefined) {
      userDataToUpdate.isActive = updateUserDto.isActive;
    }

    const updatedUser = await this.dataSource.transaction(async (manager) => {
      await this.userRepository.getRepository(manager).update(id, userDataToUpdate);

      await this.userRoleRepository.getRepository(manager).delete({ userId: id });
      const newUserRoles = updateUserDto.roleIds.map((roleId) =>
        this.userRoleRepository.create(
          {
            userId: id,
            roleId,
          },
          manager,
        ),
      );
      await this.userRoleRepository.saveMany(newUserRoles, manager);

      const userBranches = await this.validateAndPrepareUserBranches(
        updateUserDto.branchIds,
        updateUserDto.primaryBranchId,
        currentUser.tenantId!,
        id,
        currentUser.userId,
        manager,
      );

      await this.userBranchRepository.getRepository(manager).delete({ userId: id });
      await this.userBranchRepository.saveMany(userBranches, manager);

      return await this.userRepository.findByIdWithBranches(id, currentUser.tenantId, manager);
    });

    if (!updatedUser) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    return UserMapper.toUserResponseDto(updatedUser);
  }

  async toggleUserStatus(id: string, isActive: boolean, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findById(id, currentUser.tenantId);
    if (!existingUser) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    if (id === currentUser.userId && !isActive) {
      throw new BadRequestException(MESSAGES.USER.CANNOT_SELF_DEACTIVATE);
    }

    await this.userRepository.updateStatus(id, isActive, currentUser.tenantId);
    const updatedUser = await this.userRepository.findByIdWithBranches(id, currentUser.tenantId);
    return UserMapper.toUserResponseDto(updatedUser!);
  }
}
