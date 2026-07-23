import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (transactionalEntityManager) => {
    const roleRepository = transactionalEntityManager.getRepository(Role);
    const userRepository = transactionalEntityManager.getRepository(User);
    const userRoleRepository = transactionalEntityManager.getRepository(UserRole);

    let role = await roleRepository.findOne({
      where: { name: PlatformRoleCodes.PLATFORM_SUPER_ADMIN },
    });

    if (!role) {
      role = roleRepository.create({
        name: PlatformRoleCodes.PLATFORM_SUPER_ADMIN,
        tenantId: null,
      });
      role = await roleRepository.save(role);
      console.log(`Role "${PlatformRoleCodes.PLATFORM_SUPER_ADMIN}" seeded successfully.`);
    }

    let user = await userRepository.findOne({
      where: {
        email: process.env.SUPER_ADMIN_EMAIL,
      },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(process.env.GENERAL_PASSWORD!, 12);

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
  });
}
