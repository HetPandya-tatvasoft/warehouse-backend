import type { User } from '../entities/user.entity';
import { AuthUserDto } from '../../auth/dto/auth-user.dto';

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
}
