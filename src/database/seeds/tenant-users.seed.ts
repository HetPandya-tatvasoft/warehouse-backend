import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
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

      let role = await roleRepository.findOne({
        where: { name: PlatformRoleCodes.TENANT_ADMIN },
      });

      if (!role) {
        role = roleRepository.create({
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: null,
        });
        role = await roleRepository.save(role);
        console.log(`Role "${PlatformRoleCodes.TENANT_ADMIN}" seeded successfully.`);
      }

      let tenant = await tenantRepository.findOne({
        where: { name: tenantName },
      });

      if (!tenant) {
        tenant = tenantRepository.create({
          name: tenantName,
        });
        tenant = await tenantRepository.save(tenant);
        console.log(`Tenant "${tenantName}" seeded successfully.`);
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
        console.log(`Tenant Admin user "${userEmail}" seeded successfully.`);
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
        console.log('Tenant Admin user-role mapping seeded successfully.');
      }
    });
  }
}
