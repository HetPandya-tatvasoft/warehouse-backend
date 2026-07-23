import type { User } from '../entities/user.entity';
import { AuthUserDto } from '../../auth/dto/auth-user.dto';

export interface IUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export class UserMapper {
  static toAuthUserDto(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    dto.userId = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.tenantId = user.tenantId ?? null;
    dto.roles = user.userRoles ? user.userRoles.map((ur) => ur.role?.name).filter(Boolean) : [];
    return dto;
  }

  static toUserResponseDto(user: User): IUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles
        ? user.userRoles
            .filter((ur) => ur.role)
            .map((ur) => ({
              id: ur.role.id,
              name: ur.role.name,
              description: ur.role.description,
            }))
        : [],
    };
  }
}
