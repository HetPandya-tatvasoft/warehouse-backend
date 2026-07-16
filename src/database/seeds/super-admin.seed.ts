import { Role } from '@/modules/roles-and-permissions/entities/role.entity';
import { UserRole } from '@/modules/users/entities/user-role.entity';
import { User } from '@/modules/users/entities/user.entity';
import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);
  const userRoleRepository = dataSource.getRepository(UserRole);

  let role = await roleRepository.findOne({
    where: { name: 'PLATFORM_SUPER_ADMIN' },
  });

  if (!role) {
    role = roleRepository.create({
      name: 'PLATFORM_SUPER_ADMIN',
      tenantId: null,
    });
    role = await roleRepository.save(role);
  }

  let user = await userRepository.findOne({
    where: {
      email: process.env.SUPER_ADMIN_EMAIL,
    },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD!, 12);

    user = userRepository.create({
      email: process.env.SUPER_ADMIN_EMAIL!,
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      tenantId: null,
    });

    user = await userRepository.save(user);
  }

  const existing = await userRoleRepository.findOne({
    where: {
      userId: user.id,
      roleId: role.id,
    },
  });

  if (!existing) {
    const userRole = userRoleRepository.create({
      userId: user.id,
      roleId: role.id,
    });

    await userRoleRepository.save(userRole);
  }
}
