import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
import { PageAccess } from '../../modules/roles-and-permissions/entities/page-access.entity';
import { RolePageRight } from '../../modules/roles-and-permissions/entities/role-page-right.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantUserSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const tenantName = 'Tatvasoft';
    const userFirstName = 'Het';
    const userLastName = 'Pandya';
    const userEmail = 'het.pandya@yopmail.com';

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const tenantRepository = transactionalEntityManager.getRepository(Tenant);
      const roleRepository = transactionalEntityManager.getRepository(Role);
      const userRepository = transactionalEntityManager.getRepository(User);
      const userRoleRepository = transactionalEntityManager.getRepository(UserRole);

      let tenant = await tenantRepository.findOne({
        where: { name: tenantName },
      });

      if (!tenant) {
        tenant = tenantRepository.create({
          name: tenantName,
        });
        tenant = await tenantRepository.save(tenant);
      }

      let role = await roleRepository.findOne({
        where: {
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: tenant.id,
        },
      });

      if (!role) {
        role = roleRepository.create({
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: tenant.id,
        });
        role = await roleRepository.save(role);
      }

      let user = await userRepository.findOne({
        where: {
          email: userEmail,
          tenantId: tenant.id,
        },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(process.env.GENERAL_PASSWORD!, 12);

        user = userRepository.create({
          lastName: userLastName,
          firstName: userFirstName,
          email: userEmail,
          tenantId: tenant.id,
          passwordHash: passwordHash,
        });
        user = await userRepository.save(user);
      }

      let userRoleMapping = await userRoleRepository.findOne({
        where: {
          userId: user.id,
          roleId: role.id,
        },
      });

      if (!userRoleMapping) {
        userRoleMapping = userRoleRepository.create({
          userId: user.id,
          roleId: role.id,
        });
        await userRoleRepository.save(userRoleMapping);
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
