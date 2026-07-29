import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
import { PageAccess } from '../../modules/roles-and-permissions/entities/page-access.entity';
import { RolePageRight } from '../../modules/roles-and-permissions/entities/role-page-right.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const roleRepository = transactionalEntityManager.getRepository(Role);
      const userRepository = transactionalEntityManager.getRepository(User);
      const userRoleRepository = transactionalEntityManager.getRepository(UserRole);

      let role: Role | null = await roleRepository.findOne({
        where: { name: PlatformRoleCodes.PLATFORM_SUPER_ADMIN },
      });

      if (!role) {
        role = roleRepository.create({
          name: PlatformRoleCodes.PLATFORM_SUPER_ADMIN,
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

      const pageAccessRepository = transactionalEntityManager.getRepository(PageAccess);
      const rolePageRightRepository = transactionalEntityManager.getRepository(RolePageRight);

      const pageAccesses = await pageAccessRepository.find();
      for (const pageAccess of pageAccesses) {
        let rolePageRight = await rolePageRightRepository.findOne({
          where: {
            roleId: role.id,
            pageAccessId: pageAccess.id,
          },
        });

        if (!rolePageRight) {
          rolePageRight = rolePageRightRepository.create({
            roleId: role.id,
            pageAccessId: pageAccess.id,
          });
          await rolePageRightRepository.save(rolePageRight);
        }
      }
    });
  }
}
