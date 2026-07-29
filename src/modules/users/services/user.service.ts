import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../../roles-and-permissions/repositories/role.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPaginationQueryDto } from '../dto/user-pagination.dto';
import { UserMapper, IUserResponseDto } from '../mappers/user.mapper';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { AUTH_CONSTANTS } from '@/common/constants/auth.constants';

import { MailService } from '../../mail/services/mail.service';
import { RESPONSE_MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly mailService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(RESPONSE_MESSAGES.USER.EMAIL_EXISTS);
    }

    // Verify role IDs exist and are valid for this tenant
    for (const roleId of createUserDto.roleIds) {
      const role = await this.roleRepository.findById(roleId, currentUser.tenantId);
      if (!role) {
        throw new NotFoundException(RESPONSE_MESSAGES.ROLE.NOT_FOUND_IN_TENANT(roleId));
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

    const createdUser = await this.userRepository.createUserWithRoles(userToCreate, createUserDto.roleIds);

    await this.mailService.send({
      to: createdUser.email,
      subject: 'Welcome to Warehouse Inventory Management - Your Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Welcome to Warehouse Inventory Management</h2>
          <p>Hello <strong>${createdUser.firstName} ${createdUser.lastName}</strong>,</p>
          <p>Your user account has been successfully created. Here are your account login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${createdUser.email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${createUserDto.password}</p>
          </div>
          <p>Please log in and change your password as soon as possible for security reasons.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated notification from Warehouse Inventory Management System.</p>
        </div>
      `,
    });

    return UserMapper.toUserResponseDto(createdUser);
  }

  async getUsersPaginated(
    currentUser: ICurrentUserData,
    query: UserPaginationQueryDto,
  ): Promise<IPaginatedResponse<IUserResponseDto>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search } = query;

    const [users, totalItems] = await this.userRepository.findPaginated(
      currentUser.tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
    );

    return {
      items: users.map((user) => UserMapper.toUserResponseDto(user)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  async getUserById(id: string, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const user = await this.userRepository.findById(id, currentUser.tenantId);
    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER.NOT_FOUND);
    }
    return UserMapper.toUserResponseDto(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findById(id, currentUser.tenantId);
    if (!existingUser) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER.NOT_FOUND);
    }

    if (id === currentUser.userId && updateUserDto.isActive === true) {
      throw new BadRequestException(RESPONSE_MESSAGES.USER.CANNOT_SELF_UPDATE);
    }

    if (updateUserDto.roleIds && updateUserDto.roleIds.length > 0) {
      for (const roleId of updateUserDto.roleIds) {
        const role = await this.roleRepository.findById(roleId, currentUser.tenantId);
        if (!role) {
          throw new NotFoundException(RESPONSE_MESSAGES.ROLE.NOT_FOUND_IN_TENANT(roleId));
        }
      }
    }

    const userDataToUpdate: Partial<typeof existingUser> = {};
    if (updateUserDto.firstName !== undefined) userDataToUpdate.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) userDataToUpdate.lastName = updateUserDto.lastName;
    if (updateUserDto.isActive !== undefined) userDataToUpdate.isActive = updateUserDto.isActive;

    const updatedUser = await this.userRepository.updateUserWithRoles(
      id,
      userDataToUpdate,
      updateUserDto.roleIds,
      currentUser.tenantId,
    );

    if (!updatedUser) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER.NOT_FOUND);
    }

    return UserMapper.toUserResponseDto(updatedUser);
  }

  async toggleUserStatus(id: string, isActive: boolean, currentUser: ICurrentUserData): Promise<IUserResponseDto> {
    const existingUser = await this.userRepository.findById(id, currentUser.tenantId);
    if (!existingUser) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER.NOT_FOUND);
    }

    if (id === currentUser.userId && !isActive) {
      throw new BadRequestException(RESPONSE_MESSAGES.USER.CANNOT_SELF_DEACTIVATE);
    }

    await this.userRepository.updateStatus(id, isActive, currentUser.tenantId);
    const updatedUser = await this.userRepository.findById(id, currentUser.tenantId);
    return UserMapper.toUserResponseDto(updatedUser!);
  }
}
